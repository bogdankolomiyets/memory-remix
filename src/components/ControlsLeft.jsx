import React, { useState } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';

const ControlsLeft = () => {
   const { isPlaying, togglePlay, isRecording, startRecording, stopRecording, setVolume, setPitch, isLooping, toggleLoop } = useAudioEngine();

   const [vol, setVolState] = useState(0.8);
   const [pitch, setPitchState] = useState(1);

   const toggleRec = () => {
      if (isRecording) {
         stopRecording();
      } else {
         startRecording();
      }
   };

   const resetVol = () => {
      setVolState(0.8);
      setVolume(0.8);
   };

   const resetPitch = () => {
      setPitchState(1);
      setPitch(1);
   };

   return (
      <div className="controls-left">
         {/* 1. Play Button Group */}
         <div className="control-group">
            <button
               className={`circle-btn play-btn ${isPlaying ? 'active' : ''}`}
               onClick={togglePlay}
               title="Play/Pause"
            >
               {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
         </div>

         {/* 2. Upload / Record Group */}
         <div className="control-group">
            <button
               className={`circle-btn record-btn ${isRecording ? 'recording-active' : ''}`}
               title={isRecording ? "Stop Recording" : "Start Recording"}
               onClick={toggleRec}
            >
               {isRecording ? 'STOP' : 'REC'}
            </button>
         </div>

         {/* 3. Sliders (Volume & Pitch) */}
         <div className="sliders-container">
            {/* Volume Slider */}
            <div className="slider-wrapper">
               <label>VOL</label>
               <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vol}
                  className="vertical-slider"
                  onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     setVolState(val);
                     setVolume(val);
                  }}
               />
               <button className="circle-btn reset-btn" onClick={resetVol} title="Reset Volume">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                     <path d="M3 3v5h5" />
                  </svg>
               </button>
            </div>

            {/* Pitch Slider */}
            <div className="slider-wrapper">
               <label>PITCH</label>
               <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  className="vertical-slider"
                  onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     setPitchState(val);
                     setPitch(val);
                  }}
               />
               <button className="circle-btn reset-btn" onClick={resetPitch} title="Reset Pitch">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                     <path d="M3 3v5h5" />
                  </svg>
               </button>
            </div>
         </div>

         {/* 4. Loop Toggle */}
         <div className="control-group bottom-group">
            <button
               className={`circle-btn loop-btn ${isLooping ? 'active' : ''}`}
               onClick={toggleLoop}
               style={{
                  backgroundColor: isLooping ? 'var(--color-highlight)' : 'transparent',
                  color: isLooping ? 'white' : 'var(--color-accent)'
               }}
            >
               LOOP
            </button>
         </div>
      </div>
   );
};

export default ControlsLeft;
