import React from 'react';
import ControlsLeft from './components/ControlsLeft';
import ControlsRight from './components/ControlsRight';
import CenterStage from './components/CenterStage';

function App() {
   return (
      <div id="memory-remix-app">
         <div className="app-layout">
            <ControlsLeft />
            <CenterStage />
            <ControlsRight />
         </div>
      </div>
   )
}

export default App