import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../engine/AudioEngine';

export function useAudioEngine() {
   const [isPlaying, setIsPlaying] = useState(audioEngine.isPlaying);
   const [bpm, setBpm] = useState(audioEngine.bpm);
   const [currentBeat, setCurrentBeat] = useState(0);
   const [isRecording, setIsRecording] = useState(audioEngine.isRecording);
   const [isMetronomeOn, setIsMetronomeOn] = useState(audioEngine.isMetronomeOn);
   const [recordingUrl, setRecordingUrl] = useState(null);

   // Separate Track States
   const [userVolume, setUserVolumeState] = useState(0.8);
   const [recordVolume, setRecordVolumeState] = useState(0.8);
   const [userPitch, setUserPitchState] = useState(1.0);
   const [recordPitch, setRecordPitchState] = useState(1.0);
   const [userLoop, setUserLoopState] = useState(false);
   const [recordLoop, setRecordLoopState] = useState(false);

   useEffect(() => {
      // Subscribe to engine events
      const unsubscribe = audioEngine.subscribe((event, data) => {
         if (event === 'play') setIsPlaying(data);
         if (event === 'bpm') setBpm(data);
         if (event === 'beat') setCurrentBeat(data);
         if (event === 'isRecording') setIsRecording(data);
         if (event === 'metronome') setIsMetronomeOn(data);
         if (event === 'recordingComplete') {
            setRecordingUrl(data);
            console.log("Hook: Recording ready");
         }
         // Sync local state with engine events
         if (event === 'userLoop') setUserLoopState(data);
         if (event === 'recordLoop') setRecordLoopState(data);
      });

      return () => unsubscribe();
   }, []);

   const init = useCallback(() => {
      audioEngine.init();
   }, []);

   // "PLAY" button now plays the LAST RECORDING
   const togglePlay = useCallback(() => {
      init();
      audioEngine.playRecording();
   }, [init]);

   const changeBpm = useCallback((newBpm) => {
      audioEngine.setBpm(newBpm);
   }, []);

   const startRecording = useCallback(async () => {
      await audioEngine.init(); // MUST resume AudioContext first!
      await audioEngine.initMicrophone();
      await audioEngine.startRecording();
   }, []);

   const stopRecording = useCallback(() => {
      audioEngine.stopRecording();
   }, []);

   const toggleMetronome = useCallback(() => {
      init(); // Ensure ctx running
      audioEngine.toggleMetronome();
   }, [init]);

   // Track Controls
   const setUserVolume = useCallback((val) => {
      setUserVolumeState(val);
      audioEngine.setUserVolume(val);
   }, []);

   const setRecordVolume = useCallback((val) => {
      setRecordVolumeState(val);
      audioEngine.setRecordVolume(val);
   }, []);

   const setUserPitch = useCallback((val) => {
      setUserPitchState(val);
      audioEngine.setUserPitch(val);
   }, []);

   const setRecordPitch = useCallback((val) => {
      setRecordPitchState(val);
      audioEngine.setRecordPitch(val);
   }, []);

   const toggleUserLoop = useCallback(() => {
      audioEngine.toggleUserLoop();
   }, []);

   const toggleRecordLoop = useCallback(() => {
      audioEngine.toggleRecordLoop();
   }, []);

   const triggerKick = useCallback(() => {
      audioEngine.triggerKick();
   }, []);

   const triggerSnare = useCallback(() => {
      audioEngine.triggerSnare();
   }, []);

   const triggerHiHat = useCallback(() => {
      audioEngine.triggerHiHat();
   }, []);

   const setRecordingDelay = useCallback((ms) => {
      audioEngine.setRecordingDelay(ms);
   }, []);

   const loadUserFile = useCallback(async (file) => {
      return await audioEngine.loadUserFile(file);
   }, []);

   return {
      isPlaying,
      bpm,
      currentBeat,
      isRecording,
      isMetronomeOn,
      recordingUrl,

      // Separate Track State
      userVolume, recordVolume,
      userPitch, recordPitch,
      userLoop, recordLoop,

      togglePlay,
      setBpm: changeBpm,
      startRecording,
      stopRecording,
      toggleMetronome,

      // Separate Track Setters
      setUserVolume, setRecordVolume,
      setUserPitch, setRecordPitch,
      toggleUserLoop, toggleRecordLoop,

      triggerKick,
      triggerSnare,
      triggerHiHat,
      setRecordingDelay,
      init,
      loadUserFile
   };
}
