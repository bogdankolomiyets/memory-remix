import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';

const ControlsRight = () => {
   const {
      bpm, setBpm, currentBeat, toggleMetronome, isMetronomeOn,
      triggerKick, triggerSnare, triggerHiHat, init
   } = useAudioEngine();

   // Local state for pad visual feedback
   const [activePads, setActivePads] = useState({
      kick: false,
      snare: false,
      hihat: false
   });

   const flashPad = useCallback((pad) => {
      setActivePads(prev => ({ ...prev, [pad]: true }));
      setTimeout(() => {
         setActivePads(prev => ({ ...prev, [pad]: false }));
      }, 100);
   }, []);

   const handleKick = useCallback(() => {
      init();
      triggerKick();
      flashPad('kick');
   }, [init, triggerKick, flashPad]);

   const handleSnare = useCallback(() => {
      init();
      triggerSnare();
      flashPad('snare');
   }, [init, triggerSnare, flashPad]);

   const handleHiHat = useCallback(() => {
      init();
      triggerHiHat();
      flashPad('hihat');
   }, [init, triggerHiHat, flashPad]);

   // Keyboard Shortcuts
   useEffect(() => {
      const handleKeyDown = (e) => {
         const key = e.key.toLowerCase();
         if (key === 'a') handleHiHat();
         if (key === 's') handleSnare();
         if (key === 'd') handleKick();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [handleKick, handleSnare, handleHiHat]);


   // --- Radial Slider Logic ---
   const radialRef = useRef(null);
   const [isDragging, setIsDragging] = useState(false);

   // Convert BPM to Angle (0 - 360)
   // Range: 40 - 208 BPM
   const bpmToAngle = (value) => {
      const min = 40;
      const max = 208;
      // Map 40->0deg, 208->359deg (approx)
      return ((value - min) / (max - min)) * 360;
   };

   // Helper to calculate position of the dot on the circle
   const getDotPosition = (angle, radius) => {
      const rad = (angle - 90) * (Math.PI / 180); // -90 to start at top
      return {
         x: radius + radius * Math.cos(rad),
         y: radius + radius * Math.sin(rad)
      };
   };

   const handleRadialInteraction = (e) => {
      if (!radialRef.current) return;
      const rect = radialRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      // Calculate Angle (radians to degrees)
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      // Map Angle to BPM
      // 0 deg = 40 bpm, 360 deg = 208 bpm
      const min = 40;
      const max = 208;
      const newBpm = Math.round(min + (angle / 360) * (max - min));

      // Clamp
      const clampedBpm = Math.max(min, Math.min(max, newBpm));
      setBpm(clampedBpm);
   };

   const handleMouseDown = (e) => {
      setIsDragging(true);
      handleRadialInteraction(e);
   };

   useEffect(() => {
      const handleGlobalMove = (e) => {
         if (isDragging) {
            e.preventDefault(); // Prevent scrolling on touch
            handleRadialInteraction(e);
         }
      };
      const handleGlobalUp = () => setIsDragging(false);

      if (isDragging) {
         window.addEventListener('mousemove', handleGlobalMove);
         window.addEventListener('mouseup', handleGlobalUp);
         window.addEventListener('touchmove', handleGlobalMove, { passive: false });
         window.addEventListener('touchend', handleGlobalUp);
      }

      return () => {
         window.removeEventListener('mousemove', handleGlobalMove);
         window.removeEventListener('mouseup', handleGlobalUp);
         window.removeEventListener('touchmove', handleGlobalMove);
         window.removeEventListener('touchend', handleGlobalUp);
      };
   }, [isDragging]);

   const radius = 56; // 1/2 of width (112px approx to fit around 90px button)
   const angle = bpmToAngle(bpm);
   const dotPos = getDotPosition(angle, radius);


   return (
      <div className="controls-right">
         {/* 1. Drum Pads */}
         <div className="pads-group">
            {/* Hi-Hat */}
            <button
               className={`circle-btn pad-btn ${activePads.hihat ? 'active' : ''}`}
               onClick={handleHiHat}
            >
               <div className="pad-icon-svg">
                  {/* Two plates + stick */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
                     <ellipse cx="20" cy="14" rx="14" ry="3" />
                     <ellipse cx="20" cy="20" rx="14" ry="3" />
                     <line x1="20" y1="14" x2="20" y2="34" />
                  </svg>
               </div>
               <span className="pad-label">HI-HAT</span>
            </button>

            {/* Snare */}
            <button
               className={`circle-btn pad-btn ${activePads.snare ? 'active' : ''}`}
               onClick={handleSnare}
            >
               <div className="pad-icon-svg">
                  {/* Cylinder + Stick */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
                     <ellipse cx="20" cy="18" rx="14" ry="4" />
                     <path d="M6 18v10c0 2.2 6.3 4 14 4s14-1.8 14-4V18" strokeLinecap="round" />
                     <line x1="20" y1="18" x2="34" y2="6" strokeLinecap="round" />
                  </svg>
               </div>
               <span className="pad-label">SNARE</span>
            </button>

            {/* Kick */}
            <button
               className={`circle-btn pad-btn ${activePads.kick ? 'active' : ''}`}
               onClick={handleKick}
            >
               <div className="pad-icon-svg">
                  {/* Pedal / Drum side view */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
                     <ellipse cx="14" cy="20" rx="4" ry="12" />
                     <path d="M14 8 L32 20" />
                     <circle cx="32" cy="20" r="3" />
                  </svg>
               </div>
               <span className="pad-label">KICK</span>
            </button>
         </div>

         {/* 2. Metronome Group */}
         <div className="metronome-group">
            {/* Radial Slider Container */}
            <div
               className="radial-slider-container"
               ref={radialRef}
               onMouseDown={handleMouseDown}
               onTouchStart={handleMouseDown}
            >
               {/* Metronome Button (Center) */}
               <button
                  className={`circle-btn metronome-btn ${isMetronomeOn && currentBeat === 0 ? 'pulse' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleMetronome(); }}
                  style={{ zIndex: 10, position: 'relative' }}
               >
                  <div className="bpm-icon">
                     {/* Triangle Metronome */}
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 22h20L12 2z" />
                        <line x1="12" y1="18" x2="18" y2="8" stroke="var(--color-bg-panel)" strokeWidth="2" />
                     </svg>
                  </div>
                  <div className="bpm-text-group">
                     <span className="bpm-label">METRONOME</span>
                     <span className="bpm-value">{bpm} BPM</span>
                  </div>
               </button>

               {/* SVG Ring */}
               <svg className="radial-ring" width="112" height="112" viewBox="0 0 112 112">
                  {/* Track */}
                  <circle cx="56" cy="56" r="55" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  {/* Thumb Dot */}
                  <circle
                     cx={dotPos.x}
                     cy={dotPos.y}
                     r="5"
                     fill="white"
                     stroke="var(--color-bg-dark)"
                     strokeWidth="2"
                  />
               </svg>
            </div>
         </div>

         {/* 3. Submit Button */}
         <div className="submit-group">
            <button className="circle-btn submit-btn">
               SUBMIT
            </button>
         </div>
      </div>
   );
};

export default ControlsRight;
