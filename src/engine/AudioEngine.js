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

      // 3. Mic -> Recorder ONLY (Voice only)
      this.micGain.connect(this.recorderDest);

      // 4. Initial Mic State
      this.micNode = null;

      // State
      this.isPlaying = false;
      this.isMetronomeOn = false;
      this.isRecording = false;
      this.bpm = 120;
      this.bpm = 120;

      // Separate Track State
      this.userVolume = 0.8;
      this.userPitch = 1.0;
      this.userLoop = false;

      this.recordVolume = 0.8;
      this.recordPitch = 1.0;
      this.recordLoop = false;

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
      this.recordingStartTime = 0;
      this.sequenceDelay = 0.085; // Default delay: 85ms
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
         console.log(`[AudioEngine] User file loaded. Duration: ${audioBuffer.duration}s`);
         return true;
      } catch (err) {
         console.error("[AudioEngine] Failed to decode user file:", err);
         return false;
      }
   }

   subscribe(cb) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
   }

   emit(event, data) {
      this.listeners.forEach(cb => cb(event, data));
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
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
   }

   setUserPitch(val) {
      this.userPitch = val;
      if (this.userPlaybackSource && this.userPlaybackSource.playbackRate) {
         this.userPlaybackSource.playbackRate.value = val;
      }
   }

   setRecordPitch(val) {
      this.recordPitch = val;
      // Voice
      if (this.playbackSource && this.playbackSource.playbackRate) {
         this.playbackSource.playbackRate.value = val;
      }
   }

   toggleUserLoop() {
      this.userLoop = !this.userLoop;
      this.emit('userLoop', this.userLoop);
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
            this.recordedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            console.log("Audio Successfully Decoded. Buffer Duration:", this.recordedBuffer.duration);
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
      if (this.playbackSource) {
         this.playbackSource.onended = null;
         try { this.playbackSource.stop(); } catch (e) { }
         this.playbackSource = null;
      }
      if (this.userPlaybackSource) {
         try { this.userPlaybackSource.stop(); } catch (e) { }
         this.userPlaybackSource = null;
      }
      // Clear sequencer timeouts
      this.playbackTimeouts.forEach(t => clearTimeout(t));
      this.playbackTimeouts = [];

      if (this.loopIntervalID) {
         clearTimeout(this.loopIntervalID); // Changed from clearInterval to clearTimeout
         this.loopIntervalID = null;
      }

      this.isPlaying = false;
      this.emit('play', false);
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
}

export const audioEngine = new AudioEngine();
