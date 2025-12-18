import React from 'react';
import ControlsLeft from './components/ControlsLeft';
import ControlsRight from './components/ControlsRight';
import CenterStage from './components/CenterStage';
import DebugLatency from './components/DebugLatency';
import { audioEngine } from './engine/AudioEngine';
import { useEffect } from 'react';

function App({ debugMode, samples }) {
   useEffect(() => {
      if (samples) {
         if (samples.kick) audioEngine.loadSample('kick', samples.kick);
         if (samples.snare) audioEngine.loadSample('snare', samples.snare);
         if (samples.hihat) audioEngine.loadSample('hihat', samples.hihat);
      }
   }, [samples]);

   return (
      <div id="memory-remix-app">
         <div className="app-layout">
            <ControlsLeft />
            <CenterStage />
            <ControlsRight />
         </div>
         {debugMode && <DebugLatency />}
      </div>
   )
}

export default App