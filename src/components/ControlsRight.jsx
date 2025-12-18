import React, { useEffect, useState, useCallback } from 'react';
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

   return (
      <div className="controls-right">
         {/* 1. Drum Pads */}
         <div className="pads-group">
            <button
               className={`circle-btn pad-btn ${activePads.hihat ? 'active' : ''}`}
               onClick={handleHiHat}
            >
               HI-HAT (A)
            </button>
            <button
               className={`circle-btn pad-btn ${activePads.snare ? 'active' : ''}`}
               onClick={handleSnare}
            >
               SNARE (S)
            </button>
            <button
               className={`circle-btn pad-btn ${activePads.kick ? 'active' : ''}`}
               onClick={handleKick}
            >
               KICK (D)
            </button>
         </div>

         {/* 2. Metronome */}
         <div className="metronome-group">
            <button
               className={`circle-btn metronome-btn ${isMetronomeOn && currentBeat === 0 ? 'pulse' : ''}`}
               onClick={toggleMetronome}
               style={{ borderColor: isMetronomeOn ? 'var(--color-highlight)' : 'white' }}
            >
               <div className="bpm-display">
                  <span>METRONOME</span>
                  <span className="bpm-val">{bpm} BPM</span>
               </div>
            </button>

            {/* Simple Range for BPM */}
            <input
               type="range"
               min="40"
               max="208"
               value={bpm}
               onChange={(e) => setBpm(parseInt(e.target.value))}
               className="bpm-slider"
            />
         </div>

         <button className="submit-btn circle-btn">
            SUBMIT
         </button>
      </div>
   );
};

export default ControlsRight;
