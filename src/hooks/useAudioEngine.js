import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../engine/AudioEngine';

export function useAudioEngine() {
   const [isPlaying, setIsPlaying] = useState(audioEngine.isPlaying);
   const [bpm, setBpm] = useState(audioEngine.bpm);
   const [currentBeat, setCurrentBeat] = useState(0);
   const [isRecording, setIsRecording] = useState(audioEngine.isRecording);
   const [isMetronomeOn, setIsMetronomeOn] = useState(audioEngine.isMetronomeOn);

   useEffect(() => {
      // Subscribe to engine events
      const unsubscribe = audioEngine.subscribe((event, data) => {
         if (event === 'play') setIsPlaying(data);
         if (event === 'bpm') setBpm(data);
         if (event === 'beat') setCurrentBeat(data);
         if (event === 'isRecording') setIsRecording(data);
         if (event === 'metronome') setIsMetronomeOn(data);
         if (event === 'recordingComplete') {
            console.log("Hook: Recording ready");
         }
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

   const setVolume = useCallback((val) => {
      audioEngine.setMasterVolume(val);
   }, []);

   const setPitch = useCallback((val) => {
      audioEngine.setPitch(val);
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

   return {
      isPlaying,
      bpm,
      currentBeat,
      isRecording,
      isMetronomeOn,
      togglePlay,
      setBpm: changeBpm,
      startRecording,
      stopRecording,
      toggleMetronome,
      setVolume,
      setPitch,
      triggerKick,
      triggerSnare,
      triggerHiHat,
      setRecordingDelay,
      init
   };
}
