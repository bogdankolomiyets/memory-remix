import React, { useState, useRef, useEffect } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { HintPanel } from './HintPanel';
import PlayIconSrc from '../svg/play_icon.svg';
import UploadIconSrc from '../svg/Upload_icon.svg';
import LoopIconSrc from '../svg/Loop_icon.svg';
import RecIconSrc from '../svg/start_rec_ico.svg';
import SliderIconSrc from '../svg/volume_or_pitch_slider_icon.svg';
import SliderHandleSrc from '../svg/Slider_handle.svg';

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
      isRecording, startRecording, stopRecording, loadUserFile
   } = useAudioEngine();

   const fileInputRef = useRef(null);

   const isTrack1 = trackId === 1;
   const currentVolume = isTrack1 ? userVolume : recordVolume;
   const currentPitch = isTrack1 ? userPitch : recordPitch;
   const isLooping = isTrack1 ? userLoop : recordLoop;
   const isCurrentTrackPlaying = isTrack1 ? isUserPlaying : isRecordPlaying;

   const handleVolumeChange = (e) => {
      const val = parseFloat(e.target.value);
      if (isTrack1) setUserVolume(val);
      else setRecordVolume(val);
   };

   const handlePitchChange = (e) => {
      const val = parseFloat(e.target.value);
      if (isTrack1) setUserPitch(val);
      else setRecordPitch(val);
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
               className={`circle-btn play-btn ${isCurrentTrackPlaying ? 'active' : ''} ${activeHintTarget === 'play-btn' ? 'hint-highlight' : ''}`}
               onClick={isTrack1 ? toggleUserPlay : toggleRecordPlay}
            >
               {isCurrentTrackPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                     <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
               ) : (
                  <img src={PlayIconSrc} alt="Play" className="play-svg-icon" />
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
                  <img src={RecIconSrc} alt="Record" className="rec-svg-icon" />
                  <span className="btn-label">{isRecording ? 'STOP' : 'START REC'}</span>
               </button>
            )}
         </div>

         {/* 3. Sliders */}
         <div className={`control-group sliders-group ${activeHintTarget === 'sliders-group' ? 'hint-highlight-box' : ''}`}>
            {/* Volume */}
            <div className="slider-icon-container">
               <span className="slider-label">VOL</span>
               <div className="slider-icon-wrapper">
                  <img src={SliderIconSrc} alt="Volume" className="slider-icon-svg" />
                  <img
                     src={SliderHandleSrc}
                     alt=""
                     className="slider-handle"
                     style={{ top: `${9 + (1 - currentVolume) * 140}px` }}
                  />
                  <input
                     type="range"
                     min="0" max="1" step="0.01"
                     value={currentVolume}
                     onChange={handleVolumeChange}
                     className="slider-overlay-input"
                  />
               </div>
            </div>

            {/* Pitch */}
            <div className="slider-icon-container">
               <span className="slider-label">PITCH</span>
               <div className="slider-icon-wrapper">
                  <img src={SliderIconSrc} alt="Pitch" className="slider-icon-svg" />
                  <img
                     src={SliderHandleSrc}
                     alt=""
                     className="slider-handle"
                     style={{ top: `${9 + (1 - (currentPitch - 0.5) / 1.5) * 140}px` }}
                  />
                  <input
                     type="range"
                     min="0.5" max="2.0" step="0.01"
                     value={currentPitch}
                     onChange={handlePitchChange}
                     className="slider-overlay-input"
                  />
               </div>
            </div>
         </div>

         {/* 4. Loop */}
         <div className="control-group bottom-group">
            <button
               className={`circle-btn loop-btn ${isLooping ? 'active' : ''} ${activeHintTarget === 'loop-btn' ? 'hint-highlight' : ''}`}
               onClick={handleLoopToggle}
            >
               <div className="loop-icon-wrapper">
                  <img src={LoopIconSrc} alt="Loop" className="loop-svg-icon" />
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

