import lamejs from '@breezystack/lamejs';

class AudioEngine {
   constructor() {
      // 1. Context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // 2. Nodes & Routing
      // A. Master Output (Speakers)
      // We want to hear: Metronome + Playback of Recording + Drum Pads (Monitoring)
      this.masterOut = this.ctx.destination;

      // B. Recorder Input
      // We want to record: Voice + Drum Pads (Sequence) - BUT NOT Metronome
      this.recorderDest = this.ctx.createMediaStreamDestination();

      // C. Internal Buses
      // masterGain: Volume for the "Song" (Drum Pads / Playback of REC)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;

      // userGain: Volume for the Uploaded Track
      this.userGain = this.ctx.createGain();
      this.userGain.gain.value = 0.8;

      // metronomeGain: Volume for the Click (Goes ONLY to Speakers)
      this.metronomeGain = this.ctx.createGain();
      this.metronomeGain.gain.value = 0.5;

      // micGain: Volume for Voice (Goes ONLY to Recorder, no monitoring)
      this.micGain = this.ctx.createGain();
      this.micGain.gain.value = 1.0;

      // Connections
      // 1. Metronome -> Speakers ONLY
      this.metronomeGain.connect(this.masterOut);

      // 2. Master Mix (Drums/Rec) -> Speakers
      this.masterGain.connect(this.masterOut);
      // 3. User Mix (Upload) -> Speakers
      this.userGain.connect(this.masterOut);

      // 4. Visualizer Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

      this.masterGain.connect(this.analyser);
      this.userGain.connect(this.analyser);
      this.micGain.connect(this.analyser);

      // 3. Mic -> Recorder ONLY (Voice only)
      this.micGain.connect(this.recorderDest);

      // 4. Initial Mic State
      this.micNode = null;

      // State
      this.isPlaying = false;
      this.isUserPlaying = false;     // Track 1 playback state
      this.isRecordPlaying = false;   // Track 2 playback state
      this.isMetronomeOn = false;
      this.isRecording = false;
      this.bpm = 120;

      // Separate Track State
      this.userVolume = 0.8;
      this.userPitch = 1.0;
      this.userLoop = false;
      this.userLoopState = 'OFF'; // 'OFF', 'RECORDING', 'ACTIVE'
      this.userLoopStart = 0;
      this.userLoopEnd = 0;

      this.recordVolume = 0.8;
      this.recordPitch = 1.0;
      this.recordLoop = false;
      this.currentPitch = 1.0;  // IMPORTANT: Initialize for drum synthesis!

      // Scheduler State
      this.currentBeat = 0;
      this.nextNoteTime = 0.0;
      this.timerID = null;
      this.lookahead = 25.0;
      this.scheduleAheadTime = 0.1;

      // Recording & Sequence State
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.recordedBuffer = null;
      this.userTrackBuffer = null; // New: For uploaded files
      this.recordedSequence = []; // [{type: 'kick', time: 1.2}, ...]
      this.recordingStartTime = 0;
      this.recordingOffset = 0; // Offset relative to user track playback
      this.userPlaybackStartTime = 0; // When user track started playing
      this.sequenceDelay = 0.085; // Default delay: 85ms for drums
      this.micLatencyOffset = -0.080; // Mic/driver latency compensation: -80ms
      this.isLooping = false;
      this.playbackSource = null; // Voice
      this.userPlaybackSource = null; // Uploaded Track
      this.playbackTimeouts = [];
      // We no longer use a single loopIntervalID. We rely on onended for each source.
      // Sample State
      this.sampleBuffers = {
         kick: null,
         snare: null,
         hihat: null
      };

      this.listeners = new Set();
   }

   // --- Core ---
   async init() {
      if (this.ctx.state === 'suspended') {
         await this.ctx.resume();
      }
      // Generate synthetic drum samples if not loaded from external files
      this.generateSynthSamples();
   }

   async loadSample(name, url) {
      if (!url) return;
      try {
         const response = await fetch(url);
         const arrayBuffer = await response.arrayBuffer();
         const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
         this.sampleBuffers[name] = audioBuffer;
         console.log(`[AudioEngine] Sample loaded: ${name} from ${url}`);
      } catch (err) {
         console.error(`[AudioEngine] Failed to load sample: ${name}`, err);
      }
   }

   // New: Load user file from <input type="file">
   async loadUserFile(file) {
      try {
         const arrayBuffer = await file.arrayBuffer();
         const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
         this.userTrackBuffer = audioBuffer;
         this.emit('userFileLoaded', audioBuffer);
         console.log(`[AudioEngine] User file loaded. Duration: ${audioBuffer.duration}s`);
         return true;
      } catch (err) {
         console.error("[AudioEngine] Failed to decode user file:", err);
         return false;
      }
   }

   // Generate synthetic drum samples as AudioBuffers (for export)
   generateSynthSamples() {
      // Only generate if not already loaded from external files
      if (!this.sampleBuffers.kick) {
         this.sampleBuffers.kick = this.generateKickBuffer();
      }
      if (!this.sampleBuffers.snare) {
         this.sampleBuffers.snare = this.generateSnareBuffer();
      }
      if (!this.sampleBuffers.hihat) {
         this.sampleBuffers.hihat = this.generateHiHatBuffer();
      }
   }

   generateKickBuffer() {
      const duration = 0.5;
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
         const t = i / sampleRate;
         // Exponential frequency sweep from 150Hz to near 0
         const freq = 150 * Math.exp(-t * 10);
         // Exponential amplitude decay
         const amp = Math.exp(-t * 8);
         data[i] = Math.sin(2 * Math.PI * freq * t) * amp;
      }
      return buffer;
   }

   generateSnareBuffer() {
      const duration = 0.2;
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
         const t = i / sampleRate;
         // White noise with envelope
         const noise = (Math.random() * 2 - 1);
         // Tone component
         const tone = Math.sin(2 * Math.PI * 180 * t);
         // Envelope
         const env = Math.exp(-t * 20);
         data[i] = (noise * 0.8 + tone * 0.2) * env;
      }
      return buffer;
   }

   generateHiHatBuffer() {
      const duration = 0.08;
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
         const t = i / sampleRate;
         // High-passed white noise
         const noise = (Math.random() * 2 - 1);
         // Very fast envelope
         const env = Math.exp(-t * 50) * 0.3;
         data[i] = noise * env;
      }
      return buffer;
   }

   getFrequencyData() {
      this.analyser.getByteFrequencyData(this.analyserData);
      return this.analyserData;
   }

   subscribe(cb) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
   }

   emit(event, data) {
      this.listeners.forEach(cb => cb(event, data));
   }

   // Normalize audio buffer to target peak level (0.0 - 1.0)
   normalizeBuffer(buffer, targetPeak = 0.8) {
      // Find the peak amplitude across all channels
      let maxAmplitude = 0;
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
         const channelData = buffer.getChannelData(ch);
         for (let i = 0; i < channelData.length; i++) {
            const abs = Math.abs(channelData[i]);
            if (abs > maxAmplitude) maxAmplitude = abs;
         }
      }

      // If audio is silent or already loud enough, skip
      if (maxAmplitude === 0) {
         console.log("[AudioEngine] Normalization skipped: silent audio");
         return buffer;
      }

      // Calculate gain needed
      let gain = targetPeak / maxAmplitude;

      // Limit max gain to prevent noise amplification
      const maxGain = 5.0;
      if (gain > maxGain) {
         console.log(`[AudioEngine] Limiting gain from ${gain.toFixed(2)}x to ${maxGain}x to prevent noise`);
         gain = maxGain;
      }

      // Don't reduce volume, only boost if needed
      if (gain <= 1.0) {
         console.log(`[AudioEngine] Normalization skipped: peak already at ${(maxAmplitude * 100).toFixed(1)}%`);
         return buffer;
      }

      // Create a new buffer with normalized audio
      const normalizedBuffer = this.ctx.createBuffer(
         buffer.numberOfChannels,
         buffer.length,
         buffer.sampleRate
      );

      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
         const inputData = buffer.getChannelData(ch);
         const outputData = normalizedBuffer.getChannelData(ch);
         for (let i = 0; i < inputData.length; i++) {
            outputData[i] = inputData[i] * gain;
         }
      }

      console.log(`[AudioEngine] Normalized: ${(maxAmplitude * 100).toFixed(1)}% → ${(targetPeak * 100).toFixed(0)}% (gain: ${gain.toFixed(2)}x)`);
      return normalizedBuffer;
   }

   // --- Sliders (Legacy) ---
   // setMasterVolume(val) { ... } -> repurposed below

   // --- Track Controls ---
   setUserVolume(val) {
      this.userVolume = val;
      this.userGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
   }

   setRecordVolume(val) {
      this.recordVolume = val;
      // Apply to voice (masterGain) - direct value
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
      // Apply to user track (background) proportionally: userVolume * recordVolume
      // This maintains the ratio set on Track 1 while allowing Track 2 to adjust overall mix
      if (this.isRecordPlaying) {
         const proportionalBgVolume = this.userVolume * val;
         this.userGain.gain.setTargetAtTime(proportionalBgVolume, this.ctx.currentTime, 0.01);
      }
   }

   setUserPitch(val) {
      this.userPitch = val;
      if (this.userPlaybackSource && this.userPlaybackSource.playbackRate) {
         this.userPlaybackSource.playbackRate.value = val;
      }
   }

   setRecordPitch(val) {
      this.recordPitch = val;
      // Apply to voice - direct value
      if (this.playbackSource && this.playbackSource.playbackRate) {
         this.playbackSource.playbackRate.value = val;
      }
      // Apply to user track (background) proportionally: userPitch * recordPitch
      // This maintains the relative pitch set on Track 1
      if (this.isRecordPlaying && this.userPlaybackSource && this.userPlaybackSource.playbackRate) {
         const proportionalBgPitch = this.userPitch * val;
         this.userPlaybackSource.playbackRate.value = proportionalBgPitch;
      }
   }

   toggleUserLoop() {
      // 3-State A-B Looping Logic
      if (!this.isUserPlaying && !this.isRecordPlaying) {
         // NOT PLAYING: Simple On/Off (Standard Loop)
         if (this.userLoopState === 'OFF') {
            this.userLoopState = 'ACTIVE';
            this.userLoopStart = 0;
            this.userLoopEnd = this.userTrackBuffer ? this.userTrackBuffer.duration : 0;
         } else {
            this.userLoopState = 'OFF';
         }
      } else {
         // PLAYING: A-B Logic
         if (this.userLoopState === 'OFF') {
            // Click 1: Start Recording Loop (Point A)
            this.userLoopState = 'RECORDING';
            // Calculate current playback time in the buffer
            const elapsed = this.ctx.currentTime - this.userPlaybackStartTime;
            this.userLoopStart = Math.max(0, elapsed * this.userPitch);
         } else if (this.userLoopState === 'RECORDING') {
            // Click 2: End Recording Loop (Point B) -> ACTIVE
            this.userLoopState = 'ACTIVE';
            const elapsed = this.ctx.currentTime - this.userPlaybackStartTime;
            // Ensure end > start, otherwise flip or default
            let end = Math.max(0, elapsed * this.userPitch);

            // Safety: Minimum loop size (e.g. 50ms) to prevent audio glitches
            if (end - this.userLoopStart < 0.05) {
               console.warn("[AudioEngine] Loop too short, using full track");
               end = 0; // Will trigger full track fallback below
            }

            if (end <= this.userLoopStart) {
               // If end is before start (e.g. wrapped around?), just reset to full
               end = this.userTrackBuffer ? this.userTrackBuffer.duration : end + 1;
            }
            this.userLoopEnd = end;
            console.log(`[AudioEngine] Loop Set: ${this.userLoopStart.toFixed(2)}s -> ${this.userLoopEnd.toFixed(2)}s`);

            // Apply loop immediately to the running source
            if (this.userPlaybackSource) {
               this.applyLoopToSource(this.userPlaybackSource);
            }
         } else {
            // Click 3: Turn Off
            this.userLoopState = 'OFF';
            console.log("[AudioEngine] Loop Cleared");
            if (this.userPlaybackSource) {
               this.userPlaybackSource.loop = false;
            }
         }
      }

      this.emit('userLoopState', this.userLoopState);
      // Legacy compat
      this.userLoop = this.userLoopState !== 'OFF';
      this.emit('userLoop', this.userLoop);
   }

   applyLoopToSource(source) {
      if (!source || this.userLoopState !== 'ACTIVE') return;
      try {
         source.loop = true;
         // Safety check for duration
         if (this.userLoopEnd > 0 && this.userLoopEnd > this.userLoopStart) {
            source.loopStart = this.userLoopStart;
            source.loopEnd = this.userLoopEnd;
         } else {
            // Fallback: Loop whole track if points invalid
            source.loopStart = 0;
            source.loopEnd = source.buffer.duration;
         }
      } catch (e) {
         console.warn("Failed to apply loop to source:", e);
      }
   }

   toggleRecordLoop() {
      this.recordLoop = !this.recordLoop;
      this.emit('recordLoop', this.recordLoop);
   }

   setMasterVolume(val) {
      // Legacy support or alias to Record Volume helper if needed, 
      // but for now let's just use it independently if called.
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
   }

   setPitch(val) {
      // Playback rate for the recorded buffer
      if (this.playbackSource && this.playbackSource.playbackRate) {
         this.playbackSource.playbackRate.value = val;
      }
      // Playback rate for the user track
      if (this.userPlaybackSource && this.userPlaybackSource.playbackRate) {
         this.userPlaybackSource.playbackRate.value = val;
      }
      this.currentPitch = val; // Store for next playback
   }

   setRecordingDelay(ms) {
      // Delay for the DRUMS playback relative to voice
      this.sequenceDelay = ms / 1000.0;
      console.log(`Drum Playback Offset set to: ${ms}ms`);
   }

   toggleLooping() {
      this.isLooping = !this.isLooping;
      this.emit('isLooping', this.isLooping);
      // If we are currently playing, we might need to restart to apply loop immediately
      // but simpler to just let it apply at the next cycle
   }

   // --- Sequencer Integration ---
   recordEvent(type) {
      if (!this.isRecording) return;
      const relativeTime = this.ctx.currentTime - this.recordingStartTime;
      this.recordedSequence.push({ type, time: relativeTime });
   }

   // --- Metronome ---
   toggleMetronome() {
      this.isMetronomeOn = !this.isMetronomeOn;

      // If engine isn't running, start the scheduler
      if (!this.timerID) {
         this.startScheduler();
      }

      this.emit('metronome', this.isMetronomeOn);
   }

   setBpm(bpm) {
      this.bpm = Math.max(40, Math.min(208, bpm));
      this.emit('bpm', this.bpm);
   }

   // --- Drum Pads (Synthesis) ---
   triggerKick() {
      this.recordEvent('kick');

      // If we have a sample, play it
      if (this.sampleBuffers.kick) {
         const source = this.ctx.createBufferSource();
         source.buffer = this.sampleBuffers.kick;
         source.playbackRate.value = this.currentPitch;
         source.connect(this.masterGain);
         source.start();
         return;
      }

      // Fallback: Synthesis
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(150 * this.currentPitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
   }

   triggerSnare() {
      this.recordEvent('snare');

      // If we have a sample, play it
      if (this.sampleBuffers.snare) {
         const source = this.ctx.createBufferSource();
         source.buffer = this.sampleBuffers.snare;
         source.playbackRate.value = this.currentPitch;
         source.connect(this.masterGain);
         source.start();
         return;
      }

      // Fallback: Noise component
      const bufferSize = this.ctx.sampleRate * (0.1 / this.currentPitch); // Adjust duration
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
         data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000 * this.currentPitch;

      const noiseEnv = this.ctx.createGain();
      noiseEnv.gain.setValueAtTime(1, this.ctx.currentTime);
      noiseEnv.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (0.1 / this.currentPitch));

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnv);
      noiseEnv.connect(this.masterGain);

      // Snap component (sine burst)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250 * this.currentPitch, this.ctx.currentTime);
      oscGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (0.05 / this.currentPitch));

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      noise.start();
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
   }

   triggerHiHat() {
      this.recordEvent('hihat');

      // If we have a sample, play it
      if (this.sampleBuffers.hihat) {
         const source = this.ctx.createBufferSource();
         source.buffer = this.sampleBuffers.hihat;
         source.playbackRate.value = this.currentPitch;
         source.connect(this.masterGain);
         source.start();
         return;
      }

      // Fallback: Synthesis
      const bufferSize = this.ctx.sampleRate * (0.05 / this.currentPitch); // 50ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
         data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000 * this.currentPitch;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (0.05 / this.currentPitch));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
   }

   // --- Recording ---
   async initMicrophone() {
      // Always ensure context is running when initializing mic
      if (this.ctx.state === 'suspended') {
         await this.ctx.resume();
      }

      if (this.micNode) return;
      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
         });
         this.micNode = this.ctx.createMediaStreamSource(stream);

         // Mic -> MicGain -> RecorderDest
         this.micNode.connect(this.micGain);
         this.micGain.connect(this.recorderDest);

         console.log("Mic Connected: Clean Audio -> Recorder Only");
      } catch (err) {
         console.error("Mic Error:", err);
      }
   }

   async startRecording() {
      if (this.isRecording) return;

      // CRUCIAL: Wait for mic to be ready before starting recorder
      if (!this.micNode) {
         await this.initMicrophone();
      }

      const dest = this.recorderDest;
      this.audioChunks = [];

      // Prefer high quality codecs
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
         ? { mimeType: 'audio/webm;codecs=opus' }
         : {};

      this.mediaRecorder = new MediaRecorder(dest.stream, options);

      this.mediaRecorder.ondataavailable = (e) => {
         if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = async () => {
         if (this.audioChunks.length === 0) {
            console.warn("Recording failed: No data chunks captured.");
            return;
         }

         // Create blob without forcing a specific mimeType in constructor if possible, 
         // allowing the chunks to define it, or use the one we negotiated.
         const blob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });

         console.log(`Recording finished. Size: ${blob.size} bytes. Type: ${blob.type}`);

         if (blob.size === 0) {
            console.warn("Recording empty.");
            return;
         }

         const url = URL.createObjectURL(blob);
         console.log("Recording URL:", url);

         try {
            const arrayBuffer = await blob.arrayBuffer();
            // Decode can fail if the format isn't fully supported by Web Audio API (even if MediaRecorder supports it)
            const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            console.log("Audio Successfully Decoded. Buffer Duration:", decodedBuffer.duration);

            // Normalize the recorded audio to ensure it's audible
            this.recordedBuffer = this.normalizeBuffer(decodedBuffer, 0.8);

            this.emit('recordingComplete', url);
         } catch (err) {
            console.error("Decoding Failed. The browser might support recording this format but not decoding it via Web Audio API.", err);
            // Fallback? We can't use BufferSource if decode fails. 
            // User can still download/play via URL, but 'pitch' slider won't work.
            // For now, just log.
         }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.audioChunks = [];
      this.recordedSequence = [];
      this.recordingStartTime = this.ctx.currentTime;

      // Calculate offset relative to user track playback
      if (this.isUserPlaying && this.userPlaybackStartTime > 0) {
         // How far into the user track we started recording
         this.recordingOffset = (this.ctx.currentTime - this.userPlaybackStartTime) * this.userPitch;
         console.log(`[AudioEngine] Recording offset: ${this.recordingOffset.toFixed(2)}s into user track`);
      } else {
         this.recordingOffset = 0;
      }

      // We also start the scheduler if not running, to keep time
      if (!this.timerID) this.startScheduler();

      this.emit('isRecording', true);
   }

   stopRecording() {
      if (!this.isRecording) return;
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.emit('isRecording', false);
   }

   // --- Playback ( The "PLAY" Button ) ---
   playRecording() {
      if (!this.recordedBuffer && !this.userTrackBuffer) {
         console.warn("No recording or user track to play");
         return;
      }

      if (this.isPlaying) {
         this.stopPlayback();
         return;
      }

      // --- REC TRACK LOGIC (Voice + Drums) ---
      const playRecordingTrack = () => {
         // 1. Drums
         this.playbackTimeouts.forEach(t => clearTimeout(t));
         this.playbackTimeouts = [];

         this.recordedSequence.forEach(event => {
            const timeout = setTimeout(() => {
               if (this.isPlaying) {
                  if (event.type === 'kick') this.triggerKick();
                  else if (event.type === 'snare') this.triggerSnare();
                  else if (event.type === 'hihat') this.triggerHiHat();
               }
            }, (event.time / this.recordPitch + this.sequenceDelay) * 1000);
            this.playbackTimeouts.push(timeout);
         });

         // 2. Voice
         if (this.recordedBuffer) {
            this.playbackSource = this.ctx.createBufferSource();
            this.playbackSource.buffer = this.recordedBuffer;
            this.playbackSource.playbackRate.value = this.recordPitch;
            this.playbackSource.connect(this.masterGain);

            this.playbackSource.onended = () => {
               if (this.isPlaying && this.recordLoop) {
                  playRecordingTrack();
               }
            };

            this.playbackSource.start();
         }
      };

      // --- USER TRACK LOGIC ---
      const playUserTrack = () => {
         if (!this.userTrackBuffer) return;

         this.userPlaybackSource = this.ctx.createBufferSource();
         this.userPlaybackSource.buffer = this.userTrackBuffer;
         this.userPlaybackSource.playbackRate.value = this.userPitch;
         this.userPlaybackSource.connect(this.userGain);

         this.userPlaybackSource.onended = () => {
            if (this.isPlaying && this.userLoop) {
               playUserTrack();
            }
         };

         this.userPlaybackSource.start();
      };

      // Start Both
      playRecordingTrack();
      playUserTrack();

      this.isPlaying = true;
      this.emit('play', true);
   }

   stopPlayback() {
      this.stopUserPlayback();
      this.stopRecordPlayback();

      this.isPlaying = false;
      this.emit('play', false);
   }

   // === SEPARATE TRACK PLAYBACK ===

   // --- Track 1: User Upload ---
   playUserTrackOnly() {
      if (!this.userTrackBuffer) {
         console.warn("No user track to play");
         return;
      }

      // Stop Track 2 if playing (mutual exclusion)
      if (this.isRecordPlaying) {
         this.stopRecordPlayback();
      }

      if (this.isUserPlaying) {
         this.stopUserPlayback();
         return;
      }

      const startUserTrack = () => {
         this.userPlaybackSource = this.ctx.createBufferSource();
         this.userPlaybackSource.buffer = this.userTrackBuffer;
         this.userPlaybackSource.connect(this.userGain);

         // Handle 3-state looping
         if (this.userLoopState === 'ACTIVE') {
            this.applyLoopToSource(this.userPlaybackSource);
         }

         this.userPlaybackSource.onended = () => {
            // In native looping mode, onended only fires if loop=false or track is cut
            if (this.isUserPlaying && this.userLoopState !== 'ACTIVE' && this.userLoop) {
               // Legacy fallback for simple full track loop
               startUserTrack();
            } else if (this.userLoopState !== 'ACTIVE') {
               this.isUserPlaying = false;
               this.userPlaybackStartTime = 0;
               this.emit('userPlay', false);
            }
         };

         this.userPlaybackSource.start();
         this.userPlaybackStartTime = this.ctx.currentTime; // Track when playback started
      };

      startUserTrack();
      this.isUserPlaying = true;
      this.emit('userPlay', true);
   }

   stopUserPlayback() {
      if (this.userPlaybackSource) {
         this.userPlaybackSource.onended = null;
         try { this.userPlaybackSource.stop(); } catch (e) { }
         this.userPlaybackSource = null;
      }
      this.isUserPlaying = false;
      this.userPlaybackStartTime = 0;
      this.emit('userPlay', false);
   }

   // --- Track 2: FULL MIX (User Track + Recording + Drums) ---
   playRecordTrackOnly() {
      // If nothing to play, warn
      if (!this.recordedBuffer && this.recordedSequence.length === 0 && !this.userTrackBuffer) {
         console.warn("No recording or user track to play");
         return;
      }

      // Stop Track 1 if playing (mutual exclusion)
      if (this.isUserPlaying) {
         this.stopUserPlayback();
      }

      if (this.isRecordPlaying) {
         this.stopRecordPlayback();
         return;
      }

      const startFullMix = () => {
         // Clear previous timeouts
         this.playbackTimeouts.forEach(t => clearTimeout(t));
         this.playbackTimeouts = [];

         // Calculate proportional values upfront
         const proportionalBgVolume = this.userVolume * this.recordVolume;
         const proportionalBgPitch = this.userPitch * this.recordPitch;

         // A. User Track (Background) - starts at 0
         if (this.userTrackBuffer) {
            // Set proportional background volume before playback
            this.userGain.gain.setTargetAtTime(proportionalBgVolume, this.ctx.currentTime, 0.01);

            this.userPlaybackSource = this.ctx.createBufferSource();
            this.userPlaybackSource.buffer = this.userTrackBuffer;
            this.userPlaybackSource.playbackRate.value = proportionalBgPitch;
            this.userPlaybackSource.connect(this.userGain);

            // Loop background track if user set a loop
            if (this.userLoopState === 'ACTIVE') {
               this.applyLoopToSource(this.userPlaybackSource);
            }

            this.userPlaybackSource.start();
         }

         // B. Voice - starts at recordingOffset (relative to user track)
         if (this.recordedBuffer) {
            this.playbackSource = this.ctx.createBufferSource();
            this.playbackSource.buffer = this.recordedBuffer;
            this.playbackSource.playbackRate.value = this.recordPitch;
            this.playbackSource.connect(this.masterGain);

            // Calculate when to start: offset is in "original" bg timeline
            // Background plays at proportionalBgPitch, so divide offset by that
            // Add micLatencyOffset to compensate for recording latency (-80ms = earlier)
            const voiceStartDelay = Math.max(0, (this.recordingOffset / proportionalBgPitch) + this.micLatencyOffset);
            this.playbackSource.start(this.ctx.currentTime + voiceStartDelay);

            this.playbackSource.onended = () => {
               if (this.isRecordPlaying && this.recordLoop) {
                  startFullMix();
               } else if (!this.recordLoop) {
                  // Check if user track also finished
                  // For now, just emit stop when voice ends
               }
            };
         }

         // C. Drums - offset by recordingOffset + their internal time
         if (this.recordedSequence.length > 0) {
            // Same latency compensation for drums
            const voiceStartDelay = Math.max(0, (this.recordingOffset / proportionalBgPitch) + this.micLatencyOffset);

            this.recordedSequence.forEach(event => {
               const drumTime = voiceStartDelay + (event.time / this.recordPitch) + this.sequenceDelay;
               const timeout = setTimeout(() => {
                  if (this.isRecordPlaying) {
                     if (event.type === 'kick') this.triggerKick();
                     else if (event.type === 'snare') this.triggerSnare();
                     else if (event.type === 'hihat') this.triggerHiHat();
                  }
               }, drumTime * 1000);
               this.playbackTimeouts.push(timeout);
            });
         }
      };

      startFullMix();
      this.isRecordPlaying = true;
      this.emit('recordPlay', true);
   }

   stopRecordPlayback() {
      // Stop voice
      if (this.playbackSource) {
         this.playbackSource.onended = null;
         try { this.playbackSource.stop(); } catch (e) { }
         this.playbackSource = null;
      }

      // Stop user track (background) that plays during full mix
      if (this.userPlaybackSource) {
         this.userPlaybackSource.onended = null;
         try { this.userPlaybackSource.stop(); } catch (e) { }
         this.userPlaybackSource = null;
      }

      // Clear sequencer timeouts
      this.playbackTimeouts.forEach(t => clearTimeout(t));
      this.playbackTimeouts = [];

      if (this.loopIntervalID) {
         clearTimeout(this.loopIntervalID);
         this.loopIntervalID = null;
      }

      this.isRecordPlaying = false;
      this.emit('recordPlay', false);
   }

   // --- Scheduler (The Heartbeat) ---
   startScheduler() {
      this.currentBeat = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.schedulerLoop();
   }

   schedulerLoop() {
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
         this.scheduleNote(this.currentBeat, this.nextNoteTime);
         this.nextNote(); // Advance time
      }
      this.timerID = window.setTimeout(() => this.schedulerLoop(), this.lookahead);
   }

   nextNote() {
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % 4;
   }

   scheduleNote(beatNumber, time) {
      // Only make sound if Metronome is ON
      if (this.isMetronomeOn) {
         const osc = this.ctx.createOscillator();
         const env = this.ctx.createGain();

         osc.frequency.value = (beatNumber === 0) ? 1000 : 800;

         env.gain.value = 1;
         env.gain.exponentialRampToValueAtTime(1, time + 0.001);
         env.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

         osc.connect(env);
         env.connect(this.metronomeGain); // Specific Gain for Click

         osc.start(time);
         osc.stop(time + 0.05);
      }

      // Visual Beat (always emits if loop is running which is good for sync)
      const timeUntilNote = (time - this.ctx.currentTime) * 1000;
      setTimeout(() => {
         this.emit('beat', beatNumber);
      }, Math.max(0, timeUntilNote));
   }
   // --- Export / Mixing ---
   async exportMix() {
      console.log("[AudioEngine] Starting Export Mix...");

      // Calculate proportional background pitch first
      const proportionalBgPitch = this.userPitch * this.recordPitch;

      // Calculate voice/drum offset - divide by proportionalBgPitch since that's how bg plays
      // Add micLatencyOffset to compensate for recording latency (-80ms = earlier)
      const voiceStartOffset = Math.max(0, (this.recordingOffset / proportionalBgPitch) + this.micLatencyOffset);

      // 1. Calculate Duration
      let duration = 0;
      if (this.userTrackBuffer) {
         // Background uses proportional pitch
         duration = Math.max(duration, this.userTrackBuffer.duration / proportionalBgPitch);
      }
      if (this.recordedBuffer) {
         // Voice duration + its offset
         duration = Math.max(duration, voiceStartOffset + (this.recordedBuffer.duration / this.recordPitch));
      }
      if (this.recordedSequence.length > 0) {
         const lastEvent = this.recordedSequence[this.recordedSequence.length - 1];
         const seqDuration = voiceStartOffset + (lastEvent.time / this.recordPitch) + this.sequenceDelay + 2.0;
         duration = Math.max(duration, seqDuration);
      }

      console.log(`[AudioEngine] Mix Duration: ${duration}s (voice offset: ${voiceStartOffset.toFixed(2)}s)`);

      if (duration === 0) {
         console.warn("[AudioEngine] Nothing to export (duration 0).");
         return null;
      }

      // 2. Offline Context
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * duration), sampleRate);

      // 3. Recreate Graph
      const offlineMaster = offlineCtx.createGain();
      offlineMaster.gain.value = 1.0;
      offlineMaster.connect(offlineCtx.destination);

      // B. User Track - starts at 0, proportional volume and pitch
      if (this.userTrackBuffer) {
         const proportionalBgPitch = this.userPitch * this.recordPitch;
         const userSource = offlineCtx.createBufferSource();
         userSource.buffer = this.userTrackBuffer;
         userSource.playbackRate.value = proportionalBgPitch; // Proportional pitch
         const userGain = offlineCtx.createGain();
         userGain.gain.value = this.userVolume * this.recordVolume; // Proportional volume
         userSource.connect(userGain);
         userGain.connect(offlineMaster);
         userSource.start(0);
         console.log(`[AudioEngine] Joined Track 1 to mix (vol: ${(this.userVolume * this.recordVolume * 100).toFixed(0)}%, pitch: ${proportionalBgPitch.toFixed(2)}x)`);
      }

      // C. Recorder Track (Voice) - starts at voiceStartOffset
      if (this.recordedBuffer) {
         const recSource = offlineCtx.createBufferSource();
         recSource.buffer = this.recordedBuffer;
         recSource.playbackRate.value = this.recordPitch;
         const recGain = offlineCtx.createGain();
         recGain.gain.value = this.recordVolume;
         recSource.connect(recGain);
         recGain.connect(offlineMaster);
         recSource.start(voiceStartOffset);
         console.log(`[AudioEngine] Joined Track 2 (Voice) to mix (starts at ${voiceStartOffset.toFixed(2)}s)`);
      }

      // D. Drums - offset by voiceStartOffset + their internal time
      if (this.recordedSequence.length > 0) {
         this.recordedSequence.forEach(event => {
            const time = voiceStartOffset + (event.time / this.recordPitch) + this.sequenceDelay;
            if (time >= duration) return;

            let buffer = null;
            if (event.type === 'kick') buffer = this.sampleBuffers.kick;
            else if (event.type === 'snare') buffer = this.sampleBuffers.snare;
            else if (event.type === 'hihat') buffer = this.sampleBuffers.hihat;

            if (buffer) {
               const source = offlineCtx.createBufferSource();
               source.buffer = buffer;
               source.playbackRate.value = this.recordPitch;
               const drumGain = offlineCtx.createGain();
               drumGain.gain.value = this.recordVolume;
               source.connect(drumGain);
               drumGain.connect(offlineMaster);
               source.start(time);
            }
         });
         console.log(`[AudioEngine] Joined ${this.recordedSequence.length} drum hits to mix`);
      }

      // 4. Render
      try {
         const renderedBuffer = await offlineCtx.startRendering();
         console.log("[AudioEngine] Rendering Complete. Encoding MP3...");

         try {
            const mp3Blob = this.internalBufferToMp3(renderedBuffer);
            console.log(`[AudioEngine] Mix Exported as MP3. Size: ${mp3Blob.size} bytes`);
            return mp3Blob;
         } catch (mp3Err) {
            console.warn("[AudioEngine] MP3 encoding failed, falling back to WAV:", mp3Err);
            const wavBlob = this.internalBufferToWav(renderedBuffer);
            console.log(`[AudioEngine] Mix Exported as WAV (fallback). Size: ${wavBlob.size} bytes`);
            return wavBlob;
         }
      } catch (err) {
         console.error("[AudioEngine] Export Failed:", err);
         return null;
      }
   }

   // MP3 encoder using lamejs
   internalBufferToMp3(buffer) {
      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const kbps = 128;

      console.log(`[AudioEngine] MP3 encoding: ${numChannels}ch, ${sampleRate}Hz, ${kbps}kbps, ${buffer.length} samples`);

      // Get channel data
      const left = buffer.getChannelData(0);
      const right = numChannels > 1 ? buffer.getChannelData(1) : left;
      console.log(`[AudioEngine] Got channel data, left length: ${left.length}`);

      // Convert float32 to int16
      console.log(`[AudioEngine] Converting to Int16...`);
      const leftInt16 = new Int16Array(left.length);
      const rightInt16 = new Int16Array(right.length);

      for (let i = 0; i < left.length; i++) {
         leftInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(left[i] * 32767)));
         rightInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(right[i] * 32767)));
      }
      console.log(`[AudioEngine] Conversion complete`);

      // Create MP3 encoder
      const lameLib = lamejs.default || lamejs;
      console.log(`[AudioEngine] Creating Mp3Encoder...`);

      let mp3encoder;
      try {
         mp3encoder = new lameLib.Mp3Encoder(numChannels, sampleRate, kbps);
         console.log(`[AudioEngine] Mp3Encoder created successfully`);
      } catch (e) {
         console.error(`[AudioEngine] Failed to create Mp3Encoder:`, e);
         throw e;
      }

      const mp3Data = [];

      // Encode in chunks with timeout check
      const sampleBlockSize = 1152;
      const totalChunks = Math.ceil(leftInt16.length / sampleBlockSize);
      const startTime = Date.now();
      const timeoutMs = 60000; // 60 seconds timeout

      console.log(`[AudioEngine] Encoding ${totalChunks} chunks...`);

      for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
         // Check timeout every 1000 chunks
         if (i % (sampleBlockSize * 1000) === 0) {
            const elapsed = Date.now() - startTime;
            if (elapsed > timeoutMs) {
               console.warn(`[AudioEngine] MP3 encoding timeout after ${(elapsed / 1000).toFixed(1)}s`);
               throw new Error('MP3 encoding timeout - falling back to WAV');
            }
         }

         const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
         const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);

         let mp3buf;
         if (numChannels === 1) {
            mp3buf = mp3encoder.encodeBuffer(leftChunk);
         } else {
            mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
         }

         if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
         }
      }

      // Flush remaining data
      console.log(`[AudioEngine] Flushing...`);
      const mp3end = mp3encoder.flush();
      if (mp3end.length > 0) {
         mp3Data.push(mp3end);
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[AudioEngine] MP3 encoding complete. ${mp3Data.length} chunks in ${totalTime}s`);
      return new Blob(mp3Data, { type: 'audio/mp3' });
   }

   // Fallback WAV encoder
   internalBufferToWav(buffer) {
      const numOfChan = buffer.numberOfChannels;
      const length = buffer.length * numOfChan * 2 + 44;
      const bufferArr = new ArrayBuffer(length);
      const view = new DataView(bufferArr);
      const channels = [];
      let i, sample, offset = 0, pos = 0;

      const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };
      const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
      const writeString = (s) => { for (let j = 0; j < s.length; j++) view.setUint8(pos++, s.charCodeAt(j)); };

      writeString('RIFF');
      setUint32(length - 8);
      writeString('WAVE');
      writeString('fmt ');
      setUint32(16);
      setUint16(1);
      setUint16(numOfChan);
      setUint32(buffer.sampleRate);
      setUint32(buffer.sampleRate * 2 * numOfChan);
      setUint16(numOfChan * 2);
      setUint16(16);
      writeString('data');
      setUint32(length - pos - 4);

      for (i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

      while (pos < length) {
         for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
         }
         offset++;
      }
      return new Blob([view], { type: 'audio/wav' });
   }
}

export const audioEngine = new AudioEngine();
