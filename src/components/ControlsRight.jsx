import React from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';

const ControlsRight = () => {
   const { bpm, setBpm, currentBeat, toggleMetronome, isMetronomeOn } = useAudioEngine();

   return (
      <div className="controls-right">
         {/* 1. Drum Pads */}
         <div className="pads-group">
            <button className="circle-btn pad-btn">
               HI-HAT
            </button>
            <button className="circle-btn pad-btn">
               SNARE
            </button>
            <button className="circle-btn pad-btn">
               KICK
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
