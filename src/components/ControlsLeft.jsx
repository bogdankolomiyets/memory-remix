import React, { useState, useRef, useEffect } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { HintPanel } from './HintPanel';
import UploadIconSrc from '../svg/Upload_icon.svg';


const TrackControlPanel = ({ trackId, activeHintTarget }) => {
   const {
      isPlaying,
      // Separate Controls
      userVolume, recordVolume, setUserVolume, setRecordVolume,
      userPitch, recordPitch, setUserPitch, setRecordPitch,
      userLoop, recordLoop, toggleUserLoop, toggleRecordLoop,
      // Per-track Playback
      isUserPlaying, isRecordPlaying,
      toggleUserPlay, toggleRecordPlay,
      // Recording
      isRecording, startRecording, stopRecording, loadUserFile,
      // Buffers for disabled states
      userTrackBuffer, recordedBuffer
   } = useAudioEngine();

   const fileInputRef = useRef(null);

   const isTrack1 = trackId === 1;
   const currentVolume = isTrack1 ? userVolume : recordVolume;
   const currentPitch = isTrack1 ? userPitch : recordPitch;
   const isLooping = isTrack1 ? userLoop : recordLoop;
   const isCurrentTrackPlaying = isTrack1 ? isUserPlaying : isRecordPlaying;

   // Play button is disabled if no audio to play
   const canPlay = isTrack1 ? !!userTrackBuffer : !!(recordedBuffer || userTrackBuffer);

   // Virtual value transforms: center defaults visually while maintaining proportional movement
   // Volume: 0→0, 0.8→0.5 (center), 1→1
   const volumeToVirtual = (vol) => vol <= 0.8
      ? vol / 0.8 * 0.5
      : 0.5 + (vol - 0.8) / 0.2 * 0.5;
   const virtualToVolume = (virt) => virt <= 0.5
      ? virt / 0.5 * 0.8
      : 0.8 + (virt - 0.5) / 0.5 * 0.2;

   // Pitch: 0.5→0, 1.0→0.5 (center), 2.0→1
   const pitchToVirtual = (pitch) => pitch <= 1.0
      ? (pitch - 0.5) / 0.5 * 0.5
      : 0.5 + (pitch - 1.0) / 1.0 * 0.5;
   const virtualToPitch = (virt) => virt <= 0.5
      ? 0.5 + virt / 0.5 * 0.5
      : 1.0 + (virt - 0.5) / 0.5 * 1.0;

   const handleVolumeChange = (e) => {
      const virtual = parseFloat(e.target.value);
      const actual = virtualToVolume(virtual);
      if (isTrack1) setUserVolume(actual);
      else setRecordVolume(actual);
   };

   const handlePitchChange = (e) => {
      const virtual = parseFloat(e.target.value);
      const actual = virtualToPitch(virtual);
      if (isTrack1) setUserPitch(actual);
      else setRecordPitch(actual);
   };

   const handleLoopToggle = () => {
      if (isTrack1) toggleUserLoop();
      else toggleRecordLoop();
   };

   const handleMainButtonClick = () => {
      if (isTrack1) {
         if (fileInputRef.current) fileInputRef.current.click();
      } else {
         if (isRecording) stopRecording();
         else startRecording();
      }
   };

   const handleFileChange = async (e) => {
      if (e.target.files && e.target.files[0]) {
         await loadUserFile(e.target.files[0]);
         e.target.value = '';
      }
   };

   return (
      <div className="track-control-panel">
         {/* Hidden File Input for Track 1 */}
         {isTrack1 && (
            <input
               type="file"
               ref={fileInputRef}
               style={{ display: 'none' }}
               accept="audio/*"
               onChange={handleFileChange}
            />
         )}

         {/* 1. Play Button */}
         <div className="control-group top-group">
            <button
               className={`circle-btn play-btn ${isCurrentTrackPlaying ? 'active' : ''} ${!canPlay ? 'disabled' : ''} ${activeHintTarget === 'play-btn' ? 'hint-highlight' : ''}`}
               onClick={canPlay ? (isTrack1 ? toggleUserPlay : toggleRecordPlay) : undefined}
               disabled={!canPlay}
            >
               {isCurrentTrackPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="play-svg-icon">
                     <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                  </svg>
               ) : (
                  <svg width="15" height="17" viewBox="0 0 15 17" fill="none" className="play-svg-icon">
                     <path d="M14.25 7.49677C14.9167 7.88167 14.9167 8.84392 14.25 9.22882L1.5 16.59C0.833332 16.9749 -8.14386e-07 16.4938 -7.80737e-07 15.724L-1.372e-07 1.00158C-1.03551e-07 0.231776 0.833333 -0.249349 1.5 0.135551L14.25 7.49677Z" fill="#F9FFEB" />
                  </svg>
               )}
               <span className="btn-label">{isCurrentTrackPlaying ? 'STOP' : 'PLAY'}</span>
            </button>
         </div>

         {/* 2. Middle Button (Upload or Rec) */}
         <div className="control-group middle-group">
            {isTrack1 ? (
               <button
                  className={`circle-btn upload-btn ${activeHintTarget === 'upload-btn' ? 'hint-highlight' : ''}`}
                  onClick={handleMainButtonClick}
               >
                  <img src={UploadIconSrc} alt="Upload" className="upload-svg-icon" />
                  <span className="btn-label">UPLOAD</span>
               </button>
            ) : (
               <button
                  className={`circle-btn rec-btn ${isRecording ? 'recording' : ''} ${activeHintTarget === 'rec-btn' ? 'hint-highlight' : ''}`}
                  onClick={handleMainButtonClick}
               >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="rec-svg-icon">
                     <circle cx="10" cy="10" r="10" fill={isRecording ? '#e74c3c' : '#F9FFEB'} />
                  </svg>
                  <span className="btn-label">{isRecording ? 'STOP' : 'START REC'}</span>
               </button>
            )}
         </div>

         {/* 3. Sliders */}
         <div className={`control-group sliders-group ${activeHintTarget === 'sliders-group' ? 'hint-highlight-box' : ''}`}>
            {/* Volume */}
            <div className="slider-icon-container">
               {/* Volume Max Icon (top) */}
               <svg width="22" height="18" viewBox="0 0 22 18" fill="none" className="slider-minmax-icon">
                  <path d="M9.60344 0.502023C8.56896 0.502018 4.22414 5.26989 4.22414 5.26989C1.24483 5.26989 0.5 8.03385 0.5 9.41583C0.5 13.396 4.22414 13.3545 4.22414 13.3545C4.22414 13.3545 8.15517 17.5005 9.60344 17.5005C11.0517 17.5005 12.5036 17.155 12.5 16.0494V2.36771C12.5 0.377643 10.6379 0.502027 9.60344 0.502023Z" fill="#063A5C" stroke="#063A5C" />
                  <path d="M15.5 12.886C17.7107 11.5325 17.5097 5.86205 15.5 4.63164M18.9165 15.5005C21.1271 14.147 20.9262 3.73091 18.9165 2.50049" stroke="#063A5C" strokeWidth="2" strokeLinecap="round" />
               </svg>
               <div className="slider-icon-wrapper">
                  <svg width="42" height="158" viewBox="0 0 42 158" fill="none" className="slider-icon-svg">
                     <path d="M21 149V9" stroke="#063A5C" strokeWidth="2" />
                     <rect x="8" y="77" width="26" height="2" fill="#063A5C" />
                     <rect x="13" y="63" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="130" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="50" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="117" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="37" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="104" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="25" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="92" width="16" height="2" fill="#063A5C" />
                     <rect x="0.5" y="0.5" width="41" height="157" stroke="#063A5C" />
                  </svg>
                  <svg
                     width="26" height="7" viewBox="0 0 26 7" fill="none"
                     className="slider-handle"
                     style={{ top: `${9 + (1 - volumeToVirtual(currentVolume)) * 140}px` }}
                  >
                     <rect width="26" height="7" fill="#e74c3c" />
                  </svg>
                  <input
                     type="range"
                     min="0" max="1" step="0.01"
                     value={volumeToVirtual(currentVolume)}
                     onChange={handleVolumeChange}
                     className="slider-overlay-input"
                  />
               </div>
               {/* Volume Min Icon (bottom) */}
               <svg width="13" height="18" viewBox="0 0 13 18" fill="none" className="slider-minmax-icon">
                  <path d="M9.60344 0.502023C8.56896 0.502018 4.22414 5.26989 4.22414 5.26989C1.24483 5.26989 0.5 8.03385 0.5 9.41583C0.5 13.396 4.22414 13.3545 4.22414 13.3545C4.22414 13.3545 8.15517 17.5005 9.60344 17.5005C11.0517 17.5005 12.5036 17.155 12.5 16.0494V2.36771C12.5 0.377643 10.6379 0.502027 9.60344 0.502023Z" fill="#063A5C" stroke="#063A5C" />
               </svg>
            </div>

            {/* Pitch */}
            <div className="slider-icon-container">
               {/* Pitch Max Icon (top) */}
               <svg width="20" height="11" viewBox="0 0 20 11" fill="none" className="slider-pitch-max-icon">
                  <path d="M1 5.5C2.5 -0.5 3.5 11.5 5 5.5C6.5 -0.5 7.5 -0.5 9 5.5C10.5 11.5 12.5 11.5 14 5.5C15.5 -0.5 16.5 -0.5 19 5.5" stroke="#063A5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
               <div className="slider-icon-wrapper">
                  <svg width="42" height="158" viewBox="0 0 42 158" fill="none" className="slider-icon-svg">
                     <path d="M21 149V9" stroke="#063A5C" strokeWidth="2" />
                     <rect x="8" y="77" width="26" height="2" fill="#063A5C" />
                     <rect x="13" y="63" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="130" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="50" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="117" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="37" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="104" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="25" width="16" height="2" fill="#063A5C" />
                     <rect x="13" y="92" width="16" height="2" fill="#063A5C" />
                     <rect x="0.5" y="0.5" width="41" height="157" stroke="#063A5C" />
                  </svg>
                  <svg
                     width="26" height="7" viewBox="0 0 26 7" fill="none"
                     className="slider-handle"
                     style={{ top: `${9 + (1 - pitchToVirtual(currentPitch)) * 140}px` }}
                  >
                     <rect width="26" height="7" fill="#e74c3c" />
                  </svg>
                  <input
                     type="range"
                     min="0" max="1" step="0.01"
                     value={pitchToVirtual(currentPitch)}
                     onChange={handlePitchChange}
                     className="slider-overlay-input"
                  />
               </div>
               {/* Pitch Min Icon (bottom) */}
               <svg width="18" height="4" viewBox="0 0 18 4" fill="none" className="slider-pitch-min-icon">
                  <path d="M1 2.28041C4 0.573195 6 3.98763 9 2.28041C12 0.573195 14 0.573195 17 2.28041" stroke="#063A5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
         </div>

         {/* 4. Loop */}
         <div className="control-group bottom-group">
            <button
               className={`circle-btn loop-btn ${isLooping ? 'active' : ''} ${activeHintTarget === 'loop-btn' ? 'hint-highlight' : ''}`}
               onClick={handleLoopToggle}
            >
               <div className="loop-icon-wrapper">
                  <svg width="41" height="39" viewBox="0 0 41 39" fill="none" className="loop-svg-icon">
                     <circle cx="37.2406" cy="18.0194" r="3.08154" fill={isLooping ? '#063A5C' : '#F9FFEB'} stroke={isLooping ? '#063A5C' : '#F9FFEB'} strokeWidth="1.04464" />
                     <circle cx="19.2206" cy="19.2206" r="18.6983" stroke={isLooping ? '#063A5C' : '#F9FFEB'} strokeWidth="1.04464" />
                  </svg>
               </div>
               <span className="btn-label" style={{ marginTop: '4px' }}>LOOP</span>
            </button>
         </div>
      </div>
   );
};

const ControlsLeft = ({ activeHintTarget, currentTrack, onTrackChange, hintProps, pendingTrackSwitch, onSwitchComplete }) => {
   // Carousel Logic
   const [animClass, setAnimClass] = useState('');
   const otherTrack = currentTrack === 1 ? 2 : 1;

   const handleManualSwitch = (direction) => {
      if (animClass) return; // Prevent double click
      if (direction === 'prev') setAnimClass('animate-left');
      else setAnimClass('animate-right');
   };

   const onCarouselTransitionEnd = () => {
      if (animClass === 'animate-left') onTrackChange(otherTrack);
      if (animClass === 'animate-right') onTrackChange(otherTrack);
      setAnimClass('');
      if (onSwitchComplete) onSwitchComplete();
   };

   // Programmatic switch triggered from parent (e.g., hint navigation)
   useEffect(() => {
      if (pendingTrackSwitch !== null && pendingTrackSwitch !== currentTrack && !animClass) {
         // Determine direction: if switching to track 2, go right; if to track 1, go left
         if (pendingTrackSwitch > currentTrack) {
            setAnimClass('animate-right');
         } else {
            setAnimClass('animate-left');
         }
      }
   }, [pendingTrackSwitch, currentTrack, animClass]);

   return (
      <div className="leftSide">
         <div className="controls-left">
            {/* Carousel Wrapper taking main controls space */}
            <div className="controls-carousel-wrapper">
               <div
                  className={`controls-carousel-track ${animClass}`}
                  onTransitionEnd={onCarouselTransitionEnd}
               >
                  {/* Item 1: Other Track (Left) */}
                  <TrackControlPanel trackId={otherTrack} activeHintTarget={activeHintTarget} />

                  {/* Item 2: Current Track (Center) */}
                  <TrackControlPanel trackId={currentTrack} activeHintTarget={activeHintTarget} />

                  {/* Item 3: Other Track (Right) */}
                  <TrackControlPanel trackId={otherTrack} activeHintTarget={activeHintTarget} />
               </div>
            </div>

            {/* Track Switcher (Fixed Bottom) */}
            <div className="track-switcher">
               <button
                  className={`nav-arrow ${activeHintTarget === 'track-switcher' ? 'hint-highlight' : ''}`}
                  onClick={() => handleManualSwitch('prev')}
               >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M15 19l-7-7 7-7" />
                  </svg>
               </button>

               <div className="track-display" style={{ overflow: 'hidden', width: '120px', position: 'relative' }}>
                  <div className={`text-carousel-track ${animClass}`}>
                     <span className="track-name">TRACK {otherTrack}</span>
                     <span className="track-name">TRACK {currentTrack}</span>
                     <span className="track-name">TRACK {otherTrack}</span>
                  </div>
               </div>

               <button
                  className={`nav-arrow ${activeHintTarget === 'track-switcher' ? 'hint-highlight' : ''}`}
                  onClick={() => handleManualSwitch('next')}
               >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M9 5l7 7-7 7" />
                  </svg>
               </button>
            </div>
         </div>

         {/* HintPanel inside leftSide */}
         {hintProps && (
            <HintPanel
               activeIndex={hintProps.activeIndex}
               visible={hintProps.visible}
               onNext={hintProps.onNext}
               onPrev={hintProps.onPrev}
               onHide={hintProps.onHide}
               onShow={hintProps.onShow}
            />
         )}
      </div>
   );
};

export default ControlsLeft;

