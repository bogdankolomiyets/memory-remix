import React, { useState, useEffect } from 'react';
import ControlsLeft from './components/ControlsLeft';
import ControlsRight from './components/ControlsRight';
import CenterStage from './components/CenterStage';
import DebugLatency from './components/DebugLatency';
import SubmissionSidebar from './components/SubmissionSidebar';
import { hints } from './components/HintPanel';
import { audioEngine } from './engine/AudioEngine';

function App({ debugMode, samples }) {
   const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
   const [submissionBlob, setSubmissionBlob] = useState(null);
   const [isProcessing, setIsProcessing] = useState(false);

   // Hint State
   const [activeHintIndex, setActiveHintIndex] = useState(0);
   const [isHintVisible, setIsHintVisible] = useState(true);
   const [currentTrack, setCurrentTrack] = useState(1);
   const [pendingTrackSwitch, setPendingTrackSwitch] = useState(null);

   useEffect(() => {
      if (samples) {
         if (samples.kick) audioEngine.loadSample('kick', samples.kick);
         if (samples.snare) audioEngine.loadSample('snare', samples.snare);
         if (samples.hihat) audioEngine.loadSample('hihat', samples.hihat);
      }
   }, [samples]);

   // Auto-switch track based on hint (with animation)
   useEffect(() => {
      // Hints 0-4: Track 1 (Upload/Play/etc)
      // Hints 5+: Track 2 (Mic/Loop/etc)
      const targetTrack = activeHintIndex >= 5 ? 2 : 1;
      if (targetTrack !== currentTrack) {
         setPendingTrackSwitch(targetTrack);
      }
   }, [activeHintIndex]);

   // Callback when switch animation completes
   const handleSwitchComplete = () => {
      setPendingTrackSwitch(null);
   };

   // Trigger microphone permission when user reaches the mic-setup hint OR automatically if already granted
   useEffect(() => {
      // Browsers block AudioContext auto-start. We need a user gesture.
      // Init mic on the FIRST click anywhere on the page if not already done.
      const handleFirstInteraction = () => {
         audioEngine.initMicrophone();
         // Remove listener after first attempt
         window.removeEventListener('click', handleFirstInteraction);
         window.removeEventListener('touchstart', handleFirstInteraction);
      };

      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('touchstart', handleFirstInteraction);

      return () => {
         window.removeEventListener('click', handleFirstInteraction);
         window.removeEventListener('touchstart', handleFirstInteraction);
      };
   }, []);

   useEffect(() => {
      // Also explicitly trigger on mic-setup hint (index 5) for new users
      if (activeHintIndex === 5) {
         audioEngine.initMicrophone();
      }
   }, [activeHintIndex]);


   const handleOpenSubmission = async () => {

      // Stop all playback and recording before exporting
      audioEngine.stopPlayback();
      audioEngine.stopRecording();

      setIsProcessing(true);

      // Use setTimeout to let UI update before heavy processing
      setTimeout(async () => {
         try {
            const blob = await audioEngine.exportMix();
            if (blob) {
               setSubmissionBlob(blob);
               setIsSubmissionOpen(true);
            } else {
               console.warn("[App] Mix failed or duration was 0");
               alert("Please record or upload something first!");
            }
         } finally {
            setIsProcessing(false);
         }
      }, 100);
   };

   // Hint Navigation
   const handleNextHint = () => {
      setActiveHintIndex(prev => (prev + 1) % hints.length);
   };

   const handlePrevHint = () => {
      setActiveHintIndex(prev => (prev - 1 + hints.length) % hints.length);
   };

   const activeTarget = isHintVisible ? hints[activeHintIndex].target : null;

   return (
      <div id="memory-remix-app">
         <div className="app-layout">
            <ControlsLeft
               activeHintTarget={activeTarget}
               currentTrack={currentTrack}
               onTrackChange={setCurrentTrack}
               pendingTrackSwitch={pendingTrackSwitch}
               onSwitchComplete={handleSwitchComplete}
               hintProps={{
                  activeIndex: activeHintIndex,
                  visible: isHintVisible,
                  onNext: handleNextHint,
                  onPrev: handlePrevHint,
                  onHide: () => setIsHintVisible(false),
                  onShow: () => setIsHintVisible(true)
               }}
            />
            <CenterStage />
            <ControlsRight
               onSubmit={handleOpenSubmission}
               activeHintTarget={activeTarget}
               isProcessing={isProcessing}
            />
         </div>

         {/* Mic Permission Highlight Area - Shows when mic-setup hint is active */}
         {activeTarget === 'mic-permission-area' && (
            <div className="mic-permission-area hint-highlight-box" />
         )}

         {debugMode && <DebugLatency />}

         <SubmissionSidebar
            isOpen={isSubmissionOpen}
            onClose={() => setIsSubmissionOpen(false)}
            audioBlob={submissionBlob}
         />
      </div>
   )
}

export default App