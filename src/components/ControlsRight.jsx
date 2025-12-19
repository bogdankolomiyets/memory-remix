import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import HiHatIconSrc from '../svg/Hi-Hat Icon.svg';
import SnareIconSrc from '../svg/Snare_Icon.svg';
import KickIconSrc from '../svg/Kick_Icon.svg';
import MetronomeIconSrc from '../svg/Metronome—Icon.svg';

const ControlsRight = ({ onSubmit, activeHintTarget }) => {
   const {
      bpm, setBpm, currentBeat, toggleMetronome, isMetronomeOn,
      triggerKick, triggerSnare, triggerHiHat, init,
      recordedBuffer, userTrackBuffer
   } = useAudioEngine();

   // Local state for pad visual feedback
   const [activePads, setActivePads] = useState({
      kick: false,
      snare: false,
      hihat: false
   });

   // Toast notification state
   const [showToast, setShowToast] = useState(false);
   const toastTimeoutRef = useRef(null);

   const flashPad = useCallback((pad) => {
      setActivePads(prev => ({ ...prev, [pad]: true }));
      setTimeout(() => {
         setActivePads(prev => ({ ...prev, [pad]: false }));
      }, 100);
   }, []);

   const handleKick = useCallback(async () => {
      await init();
      triggerKick();
      flashPad('kick');
   }, [init, triggerKick, flashPad]);

   const handleSnare = useCallback(async () => {
      await init();
      triggerSnare();
      flashPad('snare');
   }, [init, triggerSnare, flashPad]);

   const handleHiHat = useCallback(async () => {
      await init();
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


   // BPM range for circular slider
   const MIN_BPM = 40;
   const MAX_BPM = 208;

   // --- Arc Slider Logic (Speedometer Style, 270 degrees, gap at bottom) ---
   const dialRef = useRef(null);
   const [isDragging, setIsDragging] = useState(false);

   // Arc spans 270 degrees with 90-degree gap at the bottom
   // Start at bottom-left (225°) → end at bottom-right (495° = 135° wrapped)
   const ARC_START_ANGLE = 225; // degrees (bottom-left)
   const ARC_END_ANGLE = 495;   // degrees (bottom-right, wraps around)
   const ARC_SPAN = 270;         // total degrees
   const RADIUS = 56;            // Arc radius (hugging button edge)
   const CENTER = 72;            // center of 144x144 viewBox

   // Convert BPM to angle on the arc
   const bpmToAngle = (value) => {
      const ratio = (value - MIN_BPM) / (MAX_BPM - MIN_BPM);
      return ARC_START_ANGLE + ratio * ARC_SPAN;
   };

   // Convert angle to BPM (clamped to arc range)
   const angleToBpm = (angle) => {
      let normalizedAngle = angle;
      if (normalizedAngle < 0) normalizedAngle += 360;
      if (normalizedAngle >= 360) normalizedAngle %= 360;

      // Handle the wrap-around
      let arcAngle = normalizedAngle;
      if (normalizedAngle < ARC_START_ANGLE && normalizedAngle < 135) {
         arcAngle = normalizedAngle + 360;
      }

      // Clamp to arc bounds
      if (arcAngle < ARC_START_ANGLE) return MIN_BPM;
      if (arcAngle > ARC_END_ANGLE) return MAX_BPM;

      const ratio = (arcAngle - ARC_START_ANGLE) / ARC_SPAN;
      return Math.round(MIN_BPM + ratio * (MAX_BPM - MIN_BPM));
   };

   // Polar to cartesian for handle position
   const polarToCartesian = (cx, cy, r, angleDeg) => {
      const rad = (angleDeg - 90) * (Math.PI / 180);
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
   };

   // Generate SVG arc path
   const describeArc = (cx, cy, r, startAngle, endAngle) => {
      const start = polarToCartesian(cx, cy, r, endAngle);
      const end = polarToCartesian(cx, cy, r, startAngle);
      const largeArcFlag = (endAngle - startAngle) <= 180 ? 0 : 1;
      return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
   };

   const arcPath = describeArc(CENTER, CENTER, RADIUS, ARC_START_ANGLE, ARC_END_ANGLE);
   const currentAngle = bpmToAngle(bpm);
   const handlePos = polarToCartesian(CENTER, CENTER, RADIUS, currentAngle);

   // Pointer interaction handlers
   const handleRadialInteraction = (e) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      const newBpm = angleToBpm(angle);
      setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm)));
   };

   const handleMouseDown = (e) => {
      if (e.target.closest('.metronome-btn')) return; // Don't drag if clicking button
      setIsDragging(true);
      handleRadialInteraction(e);
   };

   useEffect(() => {
      const handleGlobalMove = (e) => {
         if (isDragging) {
            e.preventDefault();
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

   // Check if we can submit
   const canSubmit = !!(recordedBuffer || userTrackBuffer);

   return (
      <div className="rightSide">
         <div className="controls-right">
            {/* 1. Drum Pads */}
            <div className="pads-group">
               <button className={`circle-btn pad-btn ${activePads.hihat ? 'active' : ''} ${activeHintTarget === 'pads-group' ? 'hint-highlight' : ''}`} onClick={handleHiHat}>
                  <div className="pad-icon-svg">
                     <img src={HiHatIconSrc} alt="Hi-Hat" className="pad-svg-icon" />
                  </div>
                  <span className="pad-label">HI-HAT</span>
               </button>

               <button className={`circle-btn pad-btn ${activePads.snare ? 'active' : ''} ${activeHintTarget === 'pads-group' ? 'hint-highlight' : ''}`} onClick={handleSnare}>
                  <div className="pad-icon-svg">
                     <img src={SnareIconSrc} alt="Snare" className="pad-svg-icon" />
                  </div>
                  <span className="pad-label">SNARE</span>
               </button>

               <button className={`circle-btn pad-btn ${activePads.kick ? 'active' : ''} ${activeHintTarget === 'pads-group' ? 'hint-highlight' : ''}`} onClick={handleKick}>
                  <div className="pad-icon-svg">
                     <img src={KickIconSrc} alt="Kick" className="pad-svg-icon" />
                  </div>
                  <span className="pad-label">KICK</span>
               </button>
            </div>

            {/* 2. Metronome Group with custom SVG arc slider (Speedometer style) */}
            <div className="metronome-group">
               <div
                  ref={dialRef}
                  className="metronome-dial-container"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
               >
                  {/* Center button */}
                  <button
                     className={`circle-btn metronome-btn ${isMetronomeOn && currentBeat === 0 ? 'pulse' : ''} ${activeHintTarget === 'metronome-btn' ? 'hint-highlight' : ''}`}
                     onClick={toggleMetronome}
                  >
                     <div className="bpm-icon">
                        <img src={MetronomeIconSrc} alt="Metronome" className="metronome-svg-icon" />
                     </div>
                     <div className="bpm-text-group">
                        <span className="bpm-label">METRONOME</span>
                        <span className="bpm-value"><strong>{bpm} BPM</strong></span>
                     </div>
                  </button>

                  {/* Custom SVG arc slider */}
                  <svg className="radial-ring" width="160" height="160" viewBox="0 0 144 144" style={{ overflow: 'visible' }}>
                     {/* Arc track (270 degrees, gap at bottom) */}
                     <path
                        d={arcPath}
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                        strokeLinecap="round"
                     />
                     {/* Handle/thumb */}
                     <circle
                        cx={handlePos.x}
                        cy={handlePos.y}
                        r="8"
                        fill="var(--color-cyan)"
                        stroke="var(--color-cream)"
                        strokeWidth="1"
                        style={{ cursor: 'grab' }}
                     />
                  </svg>
               </div>
            </div>

            {/* 3. Submit Button */}
            <div className="submit-group">
               <button
                  className={`circle-btn submit-btn ${!canSubmit ? 'disabled' : ''}`}
                  onClick={() => {
                     if (!canSubmit) {
                        // Show toast warning
                        setShowToast(true);
                        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                        toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000);
                     } else {
                        onSubmit();
                     }
                  }}
               >
                  SUBMIT
               </button>

               {/* Toast Notification */}
               <div className={`submit-toast ${showToast ? 'visible' : ''}`}>
                  <span>⚠️</span>
                  <p>Please record or upload audio first!</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ControlsRight;
