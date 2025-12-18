import React from 'react';

const CenterStage = () => {
   return (
      <div className="center-stage">
         {/* Header / Title Area */}
         <div className="stage-header">
            <h1>Memory Remix</h1>
            <p>A project by...</p>
         </div>

         {/* 3D Placeholder */}
         <div className="visualizer-container">
            {/* This is where your Three.js Canvas will go later */}
            <div className="placeholder-ring"></div>
         </div>

         {/* Track Info (Bottom Left Overlay) */}
         <div className="track-info">
            <p>UPLOAD A TRACK OF YOUR MEMORY...</p>
            <div className="track-nav">
               <span>&lt; TRACK 1 &gt;</span>
            </div>
         </div>
      </div>
   );
};

export default CenterStage;
