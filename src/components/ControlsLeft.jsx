import React, { useState, useRef } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';

const ControlsLeft = () => {
   const {
      isPlaying,
      togglePlay,
      startRecording,
      stopRecording,
      isRecording,
      loadUserFile,
      // Separate Controls
      userVolume, recordVolume, setUserVolume, setRecordVolume,
      userPitch, recordPitch, setUserPitch, setRecordPitch,
      userLoop, recordLoop, toggleUserLoop, toggleRecordLoop
   } = useAudioEngine();

   const [currentTrack, setCurrentTrack] = useState(1); // 1 = Upload, 2 = Record
   const fileInputRef = useRef(null);

   // Determine values based on current track
   // Note: Track 1 is User Upload, Track 2 is Recording/Drums
   const currentVolume = currentTrack === 1 ? userVolume : recordVolume;
   const currentPitch = currentTrack === 1 ? userPitch : recordPitch;
   const isLooping = currentTrack === 1 ? userLoop : recordLoop;

   const handleVolumeChange = (e) => {
      const val = parseFloat(e.target.value);
      if (currentTrack === 1) setUserVolume(val);
      else setRecordVolume(val);
   };

   const handlePitchChange = (e) => {
      const val = parseFloat(e.target.value);
      if (currentTrack === 1) setUserPitch(val);
      else setRecordPitch(val);
   };

   const handleLoopToggle = () => {
      if (currentTrack === 1) toggleUserLoop();
      else toggleRecordLoop();
   };

   const handleTrackSwitch = (direction) => {
      if (direction === 'next') {
         setCurrentTrack(prev => (prev === 1 ? 2 : 1));
      } else {
         setCurrentTrack(prev => (prev === 2 ? 1 : 2));
      }
   };

   const handleMainButtonClick = () => {
      if (currentTrack === 1) {
         if (fileInputRef.current) fileInputRef.current.click();
      } else {
         if (isRecording) stopRecording();
         else startRecording();
      }
   };

   const handleFileChange = async (e) => {
      if (e.target.files && e.target.files[0]) {
         await loadUserFile(e.target.files[0]);
         e.target.value = ''; // Reset
      }
   };

   return (
      <div className="controls-left">
         {/* Hidden File Input */}
         <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="audio/*"
            onChange={handleFileChange}
         />

         {/* 1. Play Button (Top) */}
         <div className="control-group top-group">
            <button className={`circle-btn play-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlay}>
               {isPlaying ? (
                  // Stop Icon (Rect)
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                     <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
               ) : (
                  // Play Icon (Triangle)
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                     <path d="M8 5V19L19 12L8 5Z" />
                  </svg>
               )}
               <span className="btn-label">{isPlaying ? 'STOP' : 'PLAY'}</span>
            </button>
         </div>

         {/* 2. Middle Button (Dynamic: Upload vs Rec) */}
         <div className="control-group middle-group">
            {currentTrack === 1 ? (
               // TRACK 1: UPLOAD
               <button className="circle-btn upload-btn" onClick={handleMainButtonClick}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                     <polyline points="17 8 12 3 7 8" />
                     <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="btn-label">UPLOAD</span>
               </button>
            ) : (
               // TRACK 2: REC
               <button
                  className={`circle-btn rec-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleMainButtonClick}
               >
                  <div className={`rec-icon ${isRecording ? 'recording-active' : ''}`}></div>
                  <span className="btn-label">{isRecording ? 'STOP' : 'START REC'}</span>
               </button>
            )}
         </div>

         {/* 3. Sliders (Volume & Pitch) */}
         <div className="control-group sliders-group">
            {/* Volume */}
            <div className="slider-container">
               <div className="icon-top">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                     <path d="M15.54 8.46C16.47 9.39 17 10.63 17 12C17 13.37 16.47 14.61 15.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                     <path d="M19.07 4.93C21.02 6.88 22 9.44 22 12C22 14.56 21.02 17.12 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
               </div>
               {/* Vertical Slider Wrapper */}
               <div className="slider-wrapper">
                  <input
                     type="range"
                     min="0" max="1" step="0.01"
                     value={currentVolume}
                     onChange={handleVolumeChange}
                     className="vertical-slider"
                  />
                  <div className="slider-ticks"></div>
               </div>
               <div className="icon-bottom">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                  </svg>
               </div>
            </div>

            {/* Pitch */}
            <div className="slider-container">
               <div className="icon-top">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M2 12h2l2-6 4 12 4-12 2 6h2" />
                  </svg>
               </div>
               <div className="slider-wrapper">
                  <input
                     type="range"
                     min="0.5" max="2.0" step="0.01"
                     value={currentPitch}
                     onChange={handlePitchChange}
                     className="vertical-slider"
                  />
                  <div className="slider-ticks"></div>
               </div>
               {/* Pitch Wave Effect (Bottom Icon) */}
               <div className="icon-bottom">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M2 15h20" />
                  </svg>
               </div>
            </div>
         </div>

         {/* 4. Loop Toggle */}
         <div className="control-group bottom-group">
            <button
               className={`circle-btn loop-btn ${isLooping ? 'active' : ''}`}
               onClick={handleLoopToggle}
            >
               {/* Loop Circular Arrow SVG */}
               <div className="loop-icon-wrapper">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525" />
                     {/* The dot on the loop circle */}
                     {isLooping && <circle cx="3" cy="16.5" r="2.5" fill="currentColor" stroke="none" />}
                  </svg>
               </div>
               <span className="btn-label" style={{ marginTop: '4px' }}>LOOP</span>
            </button>
         </div>

         {/* 5. Track Switcher (Bottom) */}
         <div className="track-switcher">
            <button className="nav-arrow" onClick={() => handleTrackSwitch('prev')}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 19l-7-7 7-7" />
               </svg>
            </button>
            <div className="track-display">
               <span className="track-name">TRACK {currentTrack}</span>
            </div>
            <button className="nav-arrow" onClick={() => handleTrackSwitch('next')}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 5l7 7-7 7" />
               </svg>
            </button>
         </div>
      </div>
   );
};

export default ControlsLeft;
