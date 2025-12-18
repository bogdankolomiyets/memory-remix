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
      // masterGain: Volume for the "Song" (Drum Pads / Playback)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;

      // metronomeGain: Volume for the Click (Goes ONLY to Speakers)
      this.metronomeGain = this.ctx.createGain();
      this.metronomeGain.gain.value = 0.5;

      // micGain: Volume for Voice (Goes ONLY to Recorder, no monitoring)
      this.micGain = this.ctx.createGain();
      this.micGain.gain.value = 1.0;

      // Connections
      // 1. Metronome -> Speakers ONLY
      this.metronomeGain.connect(this.masterOut);

      // 2. Master Mix (Drums/Playback) -> All Destinations
      this.masterGain.connect(this.masterOut);      // Hear it
      this.masterGain.connect(this.recorderDest);   // Record it

      // 3. Mic -> Recorder ONLY (No self-monitoring)
      this.micNode = null;
      // check initMicrophone for connection logic

      // State
      this.isPlaying = false; // "Session" active?
      this.isMetronomeOn = false; // Is click active?
      this.isRecording = false;
      this.bpm = 120;

      // Scheduler State
      this.currentBeat = 0;
      this.nextNoteTime = 0.0;
      this.timerID = null;
      this.lookahead = 25.0;
      this.scheduleAheadTime = 0.1;

      // Recording State
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.recordedBuffer = null; // The buffer to play back
      this.playbackSource = null; // Source node for playing back the recording

      this.listeners = new Set();
   }

   // --- Core ---
   async init() {
      if (this.ctx.state === 'suspended') {
         await this.ctx.resume();
      }
   }

   subscribe(cb) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
   }

   emit(event, data) {
      this.listeners.forEach(cb => cb(event, data));
   }

   // --- Sliders ---
   setMasterVolume(val) {
      // Clamp 0-1
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
   }

   setPitch(val) {
      // Playback rate for the recorded buffer
      if (this.playbackSource && this.playbackSource.playbackRate) {
         this.playbackSource.playbackRate.value = val;
      }
      this.currentPitch = val; // Store for next playback
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
      // Plays the LAST recorded buffer
      if (!this.recordedBuffer) {
         console.warn("No recording to play");
         return;
      }

      if (this.isPlaying) {
         this.stopPlayback();
         return;
      }

      this.playbackSource = this.ctx.createBufferSource();
      this.playbackSource.buffer = this.recordedBuffer;
      this.playbackSource.playbackRate.value = this.currentPitch || 1.0;

      this.playbackSource.connect(this.masterGain);

      this.playbackSource.onended = () => {
         this.isPlaying = false;
         this.emit('play', false);
      };

      this.playbackSource.start();
      this.isPlaying = true;
      this.emit('play', true);
   }

   stopPlayback() {
      if (this.playbackSource) {
         this.playbackSource.stop();
         this.playbackSource = null;
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
      // Determine if we need to keep running? 
      // Yes, we run forever if app is active, 
      // OR we can pause if both Metronome & Recording & Playback are stopped.
      // For simplicity in a music app: Keep running.
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
