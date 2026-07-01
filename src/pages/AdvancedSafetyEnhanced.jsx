import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import {
  AlertCircle,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Smartphone,
  UserSearch,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { getContacts, sendSOS } from '../App';
import '../styles/pages/advancedSafety.css';

const SOUND_THRESHOLD = 10;
const SHAKE_WINDOW_MS = 1500;
const SHAKE_REQUIRED_COUNT = 3;
const DEFAULT_SHAKE_THRESHOLD = 16;
const EMERGENCY_KEYWORDS = [
  'help me',
  'help',
  'emergency',
  'save me',
  'save',
  'danger',
  'unsafe',
  'bachao',
  'bachaao',
  'please help',
];
const NO_FACE_TRIGGER_SECONDS = 12;
const MODEL_URL = '/models';

const getSpeechRecognitionConstructor = () =>
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition;

const AdvancedSafetyEnhanced = () => {
  const [alerts, setAlerts] = useState([]);
  const [soundMonitoring, setSoundMonitoring] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const [soundStatus, setSoundStatus] = useState('Not hearable');
  const [soundError, setSoundError] = useState('');
  const [shakeMonitoring, setShakeMonitoring] = useState(false);
  const [shakeStatus, setShakeStatus] = useState('Waiting for shake...');
  const [shakeError, setShakeError] = useState('');
  const [shakeAlertMessage, setShakeAlertMessage] = useState('');
  const [shakeCount, setShakeCount] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [selectedCallerId, setSelectedCallerId] = useState('custom');
  const [callerName, setCallerName] = useState('Mom');
  const [callDelay, setCallDelay] = useState(0);
  const [fakeCallStage, setFakeCallStage] = useState('idle');
  const [callCountdown, setCallCountdown] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [voiceEmergency, setVoiceEmergency] = useState(false);
  const [voicePopup, setVoicePopup] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [faceStatus, setFaceStatus] = useState('Camera stopped');
  const [faceError, setFaceError] = useState('');
  const [faceRunning, setFaceRunning] = useState(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [noFaceSeconds, setNoFaceSeconds] = useState(0);
  const [buttonClicks, setButtonClicks] = useState({
    soundStart: 0,
    soundStop: 0,
    shakeStart: 0,
    shakeStop: 0,
    fakeCall: 0,
    fakeCancel: 0,
    acceptCall: 0,
    rejectCall: 0,
    voiceStart: 0,
    voiceStop: 0,
    faceStart: 0,
    faceStop: 0,
  });

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const loudSoundTriggeredRef = useRef(false);
  const shakeEventsRef = useRef([]);
  const lastAccelerationRef = useRef(null);
  const shakeCooldownRef = useRef(0);
  const fakeCallTimeoutRef = useRef(null);
  const fakeCallIntervalRef = useRef(null);
  const callTimerRef = useRef(null);
  const ringtoneTimerRef = useRef(null);
  const ringtoneContextRef = useRef(null);
  const lastButtonPressRef = useRef({});
  const recognitionRef = useRef(null);
  const voiceMediaStreamRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const voiceTriggeredRef = useRef(false);
  const videoRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopRef = useRef(null);
  const noFaceStartedAtRef = useRef(null);
  const faceSosTriggeredRef = useRef(false);
  const laptopShakeMovesRef = useRef([]);

  useEffect(() => {
    const loadContacts = () => {
      const savedContacts = getContacts();
      setContacts(savedContacts);

      if (savedContacts.length > 0) {
        const selectedStillExists = savedContacts.some(
          (contact) => String(contact.id) === selectedCallerId
        );

        if (!selectedStillExists || selectedCallerId === 'custom') {
          const firstContact = savedContacts[0];
          setSelectedCallerId(String(firstContact.id));
          setCallerName(firstContact.name);
        }
      }
    };

    loadContacts();
    window.addEventListener('focus', loadContacts);
    window.addEventListener('storage', loadContacts);
    window.addEventListener('emergency-contacts-change', loadContacts);

    return () => {
      window.removeEventListener('focus', loadContacts);
      window.removeEventListener('storage', loadContacts);
      window.removeEventListener('emergency-contacts-change', loadContacts);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAlert = (message, type = 'info') => {
    setAlerts((current) => [
      {
        id: Date.now() + Math.random(),
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...current,
    ].slice(0, 8));
  };

  const triggerEmergencySOS = useCallback((reason, source = 'advanced-safety', transcript = '') => {
    window.alert('\uD83D\uDEA8 Emergency Detected! Sending SOS...');

    const sendWithLocation = async (coords) => {
      const lat = coords?.latitude;
      const lng = coords?.longitude;
      const locationLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : 'Location unavailable';

      //const message = `\uD83D\uDEA8 Emergency! User may be in danger. Location: ${locationLink}`;

      let message = `🚨 Emergency! User may be in danger. Location: ${locationLink}`;

if (source === "face") {
  message = `⚠ Face Detection Alert!
Reason: ${reason}
Location: ${locationLink}`;
addAlert('Face detected successfully!', 'success');
}

if (source === "voice") {
  message = `🎤 Voice Alert!
Transcript: ${transcript}
Location: ${locationLink}`;
}

if (source === "sound") {
  message = `🔊 Loud Sound Detected!
Location: ${locationLink}`;
}

if (source === "shake") {
  message = `📱 Shake Alert Triggered!
Location: ${locationLink}`;
}
      addAlert(message, 'emergency');

      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        console.log({
  userId: currentUser?._id,
  location: { lat, lng },
  source,
  reason,
  message
});

await sendSOS({
  userId: currentUser?._id,
  location: {
    lat,
    lng
  },
  source,
  reason,
  message,
  contacts
});
        setVoiceSuccess(true);
        setVoiceError('');
        setVoiceTranscript(
          transcript
            ? `"${transcript}" recognized. SOS sent successfully!`
            : 'SOS sent successfully!'
        );
      } catch (error) {
        console.error('Voice SOS failed to send:', error);
        setVoiceSuccess(false);
        setVoiceError('SOS failed to send. Please try again.');
      }
    };

    if (!navigator.geolocation) {
      sendWithLocation(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => sendWithLocation(position.coords),
      () => sendWithLocation(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  const runButtonAction = (key, action) => {
    const now = Date.now();
    if (lastButtonPressRef.current[key] && now - lastButtonPressRef.current[key] < 350) {
      return;
    }

    lastButtonPressRef.current[key] = now;
    setButtonClicks((current) => ({
      ...current,
      [key]: current[key] + 1,
    }));
    action();
  };

  const stopSoundDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    loudSoundTriggeredRef.current = false;
    setSoundMonitoring(false);
    setSoundLevel(0);
    setSoundStatus('Not hearable');
  };

  const startSoundDetection = async () => {
    stopSoundDetection();
    setSoundError('');
    setSoundStatus('Listening...');
    setSoundMonitoring(true);
    setSoundLevel(1);
    loudSoundTriggeredRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser not supported: microphone access is unavailable.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('Browser not supported: audio analysis is unavailable.');
      }

      const audioContext = new AudioContextClass();
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.35;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      addAlert('Sound detection started', 'success');

      const samples = new Uint8Array(analyser.fftSize);

      const monitor = () => {
        if (!analyserRef.current) {
          return;
        }

        analyserRef.current.getByteTimeDomainData(samples);
        let sum = 0;

        for (let i = 0; i < samples.length; i += 1) {
          const normalized = (samples[i] - 128) / 128;
          sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / samples.length);
        const level = Math.min(100, Math.max(0, Math.round(rms * 900)));
        setSoundLevel(level);
        setSoundStatus(level > 2 ? 'Listening...' : 'Not hearable');

        if (level >= SOUND_THRESHOLD && !loudSoundTriggeredRef.current) {
          loudSoundTriggeredRef.current = true;
          setSoundStatus('Loud sound detected!');
          addAlert('Loud sound detected! SOS triggered!', 'emergency');
          triggerEmergencySOS('Loud sound detected', 'sound');
        }

        animationFrameRef.current = requestAnimationFrame(monitor);
      };

      monitor();
    } catch (error) {
      console.error('Sound detection error:', error);
      setSoundError(error.message || 'Microphone permission denied.');
      addAlert(error.message || 'Microphone permission denied.', 'error');
      stopSoundDetection();
    }
  };

  const handleShakeDetected = useCallback((strength = 0) => {
    const now = Date.now();
      console.log("SHAKE DETECTED");
      console.log("Strength:", strength);
      console.log("Count:", shakeEventsRef.current.length);

    if (now - shakeCooldownRef.current < 1800) {
      return;
    }

    shakeCooldownRef.current = now;
    shakeEventsRef.current = [...shakeEventsRef.current, now].filter(
      (time) => now - time <= SHAKE_WINDOW_MS
    );

    setShakeCount((count) => count + 1);
    setShakeStatus(`Shake detected${strength ? ` at ${Math.round(strength)} strength` : ''}`);
    setShakeAlertMessage('Shake detected! Emergency SOS alert is being sent.');

    window.setTimeout(() => setShakeAlertMessage(''), 4500);

    if (shakeEventsRef.current.length >= SHAKE_REQUIRED_COUNT) {
      shakeEventsRef.current = [];
      addAlert('Shake detected! SOS triggered!', 'emergency');
      triggerEmergencySOS('Shake detected', 'shake');
    }
  }, [triggerEmergencySOS]);



  const handleShakeMotion = useCallback((event) => {
    const acceleration = event.accelerationIncludingGravity || event.acceleration;

    if (!acceleration) {
      return;
    }

    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;
    const previous = lastAccelerationRef.current;
    lastAccelerationRef.current = { x, y, z };

    if (!previous) {
      return;
    }

    const deltaX = x - previous.x;
    const deltaY = y - previous.y;
    const deltaZ = z - previous.z;
    const strength = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    const threshold = DEFAULT_SHAKE_THRESHOLD;

    if (strength < threshold) {
      return;
    }

    handleShakeDetected(strength);
  }, [handleShakeDetected]);

  const handleLaptopShakeFallback = useCallback((event) => {
    const now = Date.now();
    const movement = Math.abs(event.movementX || 0) + Math.abs(event.movementY || 0);

    if (movement < 10) {
      return;
    }

    laptopShakeMovesRef.current = [...laptopShakeMovesRef.current, now].filter(
      (time) => now - time <= 900
    );

    if (laptopShakeMovesRef.current.length >= 3) {
      laptopShakeMovesRef.current = [];
      handleShakeDetected(movement);
    }
  }, [handleShakeDetected]);

  const startShakeDetection = async () => {
    setShakeError('');
    setShakeStatus('Waiting for shake...');
    setShakeCount(0);
    setShakeMonitoring(true);
    setShakeAlertMessage('');
    shakeEventsRef.current = [];
    lastAccelerationRef.current = null;

    try {
      if (typeof DeviceMotionEvent === 'undefined') {
        window.addEventListener('mousemove', handleLaptopShakeFallback);
        setShakeStatus('Laptop fallback active. Move the laptop/touchpad/mouse sharply to trigger SOS.');
        setShakeError('Laptop browsers usually do not expose physical shake sensors, so fallback movement detection is active.');
        addAlert('Laptop shake fallback started', 'info');
        return;
      }

      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Motion permission denied.');
        }
      }

      window.removeEventListener('devicemotion', handleShakeMotion);
      window.addEventListener('devicemotion', handleShakeMotion);
      addAlert('Shake detection started', 'success');
    } catch (error) {
      console.error('Shake detection error:', error);
      setShakeError(error.message || 'Unable to start shake detection.');
      addAlert(error.message || 'Unable to start shake detection.', 'error');
      setShakeMonitoring(false);
    }
  };

  const stopShakeDetection = () => {
    window.removeEventListener('devicemotion', handleShakeMotion);
    window.removeEventListener('mousemove', handleLaptopShakeFallback);
    shakeEventsRef.current = [];
    laptopShakeMovesRef.current = [];
    lastAccelerationRef.current = null;
    setShakeMonitoring(false);
    setShakeStatus('Waiting for shake...');
    setShakeAlertMessage('');
    addAlert('Shake detection stopped', 'info');
  };

  const testShakeDetection = () => {
    setShakeMonitoring(true);
    setShakeError('');
    handleShakeDetected(DEFAULT_SHAKE_THRESHOLD + 2);
  };

  const playRingtone = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass || ringtoneTimerRef.current) {
      return;
    }

    const audioContext = new AudioContextClass();
    ringtoneContextRef.current = audioContext;

    const playBurst = () => {
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.32, audioContext.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.85);
      gainNode.connect(audioContext.destination);

      [0, 0.28, 0.56].forEach((delay) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(740, audioContext.currentTime + delay);
        oscillator.frequency.setValueAtTime(920, audioContext.currentTime + delay + 0.12);
        oscillator.connect(gainNode);
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 0.2);
      });
    };

    playBurst();
    ringtoneTimerRef.current = setInterval(playBurst, 1500);
  };

  const stopRingtone = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }

    if (ringtoneContextRef.current && ringtoneContextRef.current.state !== 'closed') {
      ringtoneContextRef.current.close();
    }

    ringtoneContextRef.current = null;
  };

  const clearFakeCallTimers = () => {
    if (fakeCallTimeoutRef.current) {
      clearTimeout(fakeCallTimeoutRef.current);
      fakeCallTimeoutRef.current = null;
    }

    if (fakeCallIntervalRef.current) {
      clearInterval(fakeCallIntervalRef.current);
      fakeCallIntervalRef.current = null;
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const triggerFakeCall = () => {
    clearFakeCallTimers();
    stopRingtone();
    const delay = Math.max(0, Number(callDelay) || 0);
    const fakeCaller = callerName.trim() || 'Mom';
    setFakeCallStage(delay === 0 ? 'ringing' : 'scheduled');
    setCallCountdown(delay);
    setCallSeconds(0);
    addAlert(`Fake call ${delay === 0 ? 'ringing' : 'scheduled'} from ${fakeCaller}`, 'success');

    if (delay === 0) {
      playRingtone();
      return;
    }

    fakeCallIntervalRef.current = setInterval(() => {
      setCallCountdown((seconds) => {
        if (seconds <= 1) {
          clearInterval(fakeCallIntervalRef.current);
          fakeCallIntervalRef.current = null;
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    fakeCallTimeoutRef.current = setTimeout(() => {
      setFakeCallStage('ringing');
      addAlert(`Incoming fake call from ${fakeCaller}`, 'info');
      playRingtone();
    }, delay * 1000);
  };

  const acceptCall = () => {
    stopRingtone();
    setFakeCallStage('accepted');
    setCallSeconds(0);
    addAlert('Fake call accepted', 'success');
    callTimerRef.current = setInterval(() => {
      setCallSeconds((seconds) => seconds + 1);
    }, 1000);
  };

  const rejectCall = () => {
    clearFakeCallTimers();
    stopRingtone();
    setFakeCallStage('idle');
    setCallCountdown(0);
    setCallSeconds(0);
    addAlert('Fake call rejected', 'info');
  };

  const handleDetectedSpeech = useCallback((spokenText) => {
    const normalizedTranscript = spokenText.toLowerCase();
    setVoiceTranscript(spokenText);
    setVoiceSuccess(false);

    const detectedKeyword = EMERGENCY_KEYWORDS.find((keyword) =>
      normalizedTranscript.includes(keyword)
    );

    if (!detectedKeyword || voiceTriggeredRef.current) {
      return;
    }

    voiceTriggeredRef.current = true;
    setVoiceEmergency(true);
    setVoicePopup(true);
    recognitionRef.current?.stop?.();
    addAlert(`Voice keyword detected: ${detectedKeyword}`, 'emergency');
    triggerEmergencySOS(`Voice emergency keyword detected: ${detectedKeyword}`, 'voice', spokenText);
  }, [triggerEmergencySOS]);

  const startVoiceSOS = async () => {
    setVoiceError('');
    setVoiceEmergency(false);
    setVoicePopup(false);
    setVoiceTranscript('Preparing microphone...');
    setVoiceListening(true);
    voiceTriggeredRef.current = false;
    shouldKeepListeningRef.current = true;

    const BrowserSpeechRecognition = getSpeechRecognitionConstructor();

    if (!BrowserSpeechRecognition) {
      setVoiceListening(false);
      setVoiceTranscript('Speech recognition is not available in this browser.');
      setVoiceError('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        voiceMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        voiceMediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }

      const recognition = new BrowserSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceListening(true);
        setVoiceError('');
        setVoiceTranscript('Listening carefully. Speak the emergency word even softly.');
      };

      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const spokenText = Array.from(lastResult)
          .map((alternative) => alternative.transcript || '')
          .join(' ')
          .trim();

        if (spokenText && lastResult.isFinal) {
          handleDetectedSpeech(spokenText);
        }
      };

      recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        setVoiceListening(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone permission is blocked. Allow microphone access in the browser.');
          shouldKeepListeningRef.current = false;
          return;
        }

        if (event.error === 'no-speech') {
          setVoiceError('No speech detected yet. Try again and speak clearly.');
          return;
        }

        setVoiceError(`Voice recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        setVoiceListening(false);

        if (shouldKeepListeningRef.current && !voiceTriggeredRef.current) {
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Voice recognition restart failed:', error);
            }
          }, 350);
        }
      };

      recognitionRef.current?.stop?.();
      recognitionRef.current = recognition;
      recognition.start();
      addAlert('Voice detection started', 'success');
    } catch (error) {
      console.error('Voice SOS failed to start', error);
      setVoiceListening(false);
      setVoiceError(error.message || 'Microphone access was blocked or unavailable.');
    }
  };

  const stopVoiceSOS = () => {
    shouldKeepListeningRef.current = false;
    setVoiceListening(false);
    setVoiceError('Voice detection stopped.');
    recognitionRef.current?.stop?.();
    voiceMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceMediaStreamRef.current = null;
    addAlert('Voice detection stopped', 'info');
  };

  const stopFaceDetection = useCallback(() => {
    if (faceLoopRef.current) {
      clearInterval(faceLoopRef.current);
      faceLoopRef.current = null;
    }

    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((track) => track.stop());
      faceStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    noFaceStartedAtRef.current = null;
    faceSosTriggeredRef.current = false;
    setFaceRunning(false);
    setFaceCount(0);
    setNoFaceSeconds(0);
    setFaceStatus('Camera stopped');
  }, []);

  const startFaceDetection = async () => {
    stopFaceDetection();
    setFaceError('');
    setFaceStatus('Loading face model...');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser not supported: camera access is unavailable.');
      }

      if (!faceModelsLoaded) {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setFaceModelsLoaded(true);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      faceStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setFaceRunning(true);
      setFaceStatus('Detecting...');
      addAlert('Face detection camera started', 'success');

      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      });

      faceLoopRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          return;
        }

        try {
          const detections = await faceapi.detectAllFaces(videoRef.current, options);
          const detectedCount = detections.length;
          setFaceCount(detectedCount);

         if (detectedCount >= 1) {
   setFaceStatus('Face detected');
   addAlert('Face detected successfully!', 'success');

   if (!faceSosTriggeredRef.current) {
      faceSosTriggeredRef.current = true;
      triggerEmergencySOS('Face detected', 'face');
   }
   return;
}

//            if (!faceSosTriggeredRef.current) {
//    faceSosTriggeredRef.current = true;
//    console.log("Triggering face SOS...");
//    triggerEmergencySOS('Face detected', 'face');
// }
//             return;
          //}

          

          if (!noFaceStartedAtRef.current) {
            noFaceStartedAtRef.current = Date.now();
          }

          const elapsed = Math.floor((Date.now() - noFaceStartedAtRef.current) / 1000);
          setNoFaceSeconds(elapsed);
          setFaceStatus('No Face Detected');

          if (elapsed >= NO_FACE_TRIGGER_SECONDS && !faceSosTriggeredRef.current) {
            faceSosTriggeredRef.current = true;
            triggerEmergencySOS('No face detected continuously by safety camera', 'face');
          }
        } catch (error) {
          console.error('Face detection loop failed:', error);
          setFaceError('Face detection failed while reading the camera feed.');
        }
      }, 500);
    } catch (error) {
      console.error('Face detection setup error:', error);
      setFaceError(error.message || 'Camera permission denied or model loading failed.');
      setFaceStatus('Camera stopped');
      addAlert(error.message || 'Face detection failed.', 'error');
      stopFaceDetection();
    }
  };

  useEffect(() => {
    return () => {
      stopSoundDetection();
      window.removeEventListener('devicemotion', handleShakeMotion);
      window.removeEventListener('mousemove', handleLaptopShakeFallback);
      clearFakeCallTimers();
      stopRingtone();
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.stop?.();
      voiceMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      stopFaceDetection();
    };
  }, [handleLaptopShakeFallback, handleShakeMotion, stopFaceDetection]);

  const fakeCaller = callerName.trim() || 'Mom';
  const noFaceRemaining = Math.max(0, NO_FACE_TRIGGER_SECONDS - noFaceSeconds);

  return (
    <div className={`advanced-safety-container ${voiceEmergency ? 'voice-emergency-active' : ''}`}>
      <div className="safety-header">
        <h1>Advanced Safety Features</h1>
        <p>Emergency tools using voice, camera, microphone, motion sensors, and fake-call simulation.</p>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Recent Activity</h2>
          <div className="alerts-list">
            {alerts.map((item) => (
              <div key={item.id} className={`alert-item ${item.type}`}>
                <span className="alert-message">{item.message}</span>
                <span className="alert-time">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="features-grid">
        <div className="feature-card face-detection wide-card">
          <div className="feature-icon">
            <UserSearch className={faceRunning ? 'active pulse' : ''} />
          </div>
          <div className="feature-content">
            <h3>Face Detection</h3>
            <p>Watches the live camera for no-face and multiple-face threat conditions.</p>
            <div className={`feature-status ${faceCount > 1 || noFaceSeconds >= NO_FACE_TRIGGER_SECONDS ? 'danger' : ''}`}>
              {faceStatus}
            </div>
            <p className="feature-meta">Faces visible: {faceCount}</p>
            <div className="face-camera-frame">
              <video ref={videoRef} muted playsInline />
              {!faceRunning && (
                <div className="camera-placeholder">
                  <VideoOff size={28} />
                  <span>Camera preview</span>
                </div>
              )}
            </div>
            <div className="face-countdown">
              <span>No face timer</span>
              <strong>{noFaceSeconds}s</strong>
              <small>SOS in {noFaceRemaining}s</small>
            </div>
            {faceError && <p className="feature-error">{faceError}</p>}
          </div>
          <div className="feature-actions">
            <button
              type="button"
              className="feature-btn"
              onClick={() => runButtonAction('faceStart', startFaceDetection)}
            >
              <Video size={18} />
              Start Camera
            </button>
            <button
              type="button"
              className="feature-btn secondary"
              onClick={() => runButtonAction('faceStop', stopFaceDetection)}
            >
              Stop
            </button>
          </div>
        </div>

        <div className={`feature-card voice-sos ${voiceEmergency ? 'danger' : ''}`}>
          <div className="feature-icon">
            <Mic className={voiceListening ? 'active pulse' : ''} />
          </div>
          <div className="feature-content">
            <h3>Voice Detection</h3>
            <p>Listens for emergency words like help me, emergency, save me, or danger.</p>
            <div className={`feature-status ${voiceListening ? 'active' : ''}`}>
              {voiceListening ? 'Listening...' : 'Stopped'}
            </div>
            <div className="voice-transcript-box">
              <div className="voice-transcript-header">
                <Volume2 size={18} />
                <span>Detected Transcript</span>
              </div>
              <p>{voiceTranscript || 'Click Start Voice Detection, allow microphone permission, then speak.'}</p>
            </div>
            {voiceSuccess && <p className="feature-success">SOS sent successfully via voice command.</p>}
            {voiceError && <p className="feature-error">{voiceError}</p>}
          </div>
          <p className="feature-click-count">Start clicks: {buttonClicks.voiceStart}</p>
          <div className="feature-actions">
            <button
              type="button"
              className="feature-btn"
              onClick={() => runButtonAction('voiceStart', startVoiceSOS)}
            >
              <Mic size={18} />
              Start Voice Detection
            </button>
            <button
              type="button"
              className="feature-btn secondary"
              onClick={() => runButtonAction('voiceStop', stopVoiceSOS)}
              disabled={!voiceListening}
            >
              <MicOff size={18} />
              Stop
            </button>
          </div>
        </div>

        <div className="feature-card sound-detection">
          <div className="feature-icon">
            <Volume2 className={soundMonitoring ? 'active pulse' : ''} />
          </div>
          <div className="feature-content">
            <h3>Sound Detection</h3>
            <p>Detects even low voice by amplifying the live microphone level.</p>
            <div className="feature-status">{soundStatus}</div>
            <p className="feature-meta">Current sound level: {soundLevel}%</p>
            <div className="sound-meter">
              <div style={{ width: `${soundLevel}%` }} />
            </div>
            {soundError && <p className="feature-error">{soundError}</p>}
          </div>
          <p className="feature-click-count">Start clicks: {buttonClicks.soundStart}</p>
          <div className="feature-actions">
            <button
              type="button"
              className="feature-btn"
              onClick={() => runButtonAction('soundStart', startSoundDetection)}
            >
              Start Sound Detection
            </button>
            <button
              type="button"
              className="feature-btn secondary"
              onClick={() => runButtonAction('soundStop', stopSoundDetection)}
            >
              Stop
            </button>
          </div>
        </div>

        <div className="feature-card shake-detection">
          <div className="feature-icon">
            <Smartphone className={shakeMonitoring ? 'active shake' : ''} />
          </div>
          <div className="feature-content">
            <h3>Shake Detection</h3>
            <p>Very sensitive motion detection. A small shake can trigger SOS.</p>
            <div className="feature-status">{shakeStatus}</div>
            <p className="feature-meta">Shake count: {shakeCount}</p>
            <p className="feature-meta">Default sensitivity: High</p>
            {shakeAlertMessage && <p className="shake-alert-message">{shakeAlertMessage}</p>}
            {shakeError && <p className="feature-error">{shakeError}</p>}
          </div>
          <p className="feature-click-count">Start clicks: {buttonClicks.shakeStart}</p>
          <div className="feature-actions">
            <button
              type="button"
              className="feature-btn"
              onClick={() => runButtonAction('shakeStart', startShakeDetection)}
            >
              Start Shake Detection
            </button>
            <button
              type="button"
              className="feature-btn secondary"
              onClick={() => runButtonAction('shakeStop', stopShakeDetection)}
            >
              Stop
            </button>
            <button
              type="button"
              className="feature-btn test"
              onClick={() => runButtonAction('shakeStart', testShakeDetection)}
            >
              Test Shake Alert
            </button>
          </div>
        </div>

        <div className="feature-card fake-call">
          <div className="feature-icon">
            <Phone className={fakeCallStage !== 'idle' ? 'active ring' : ''} />
          </div>
          <div className="feature-content">
            <h3>Fake Call</h3>
            <p>Creates a realistic incoming-call screen for emergency escape situations.</p>
            <label className="feature-label" htmlFor="caller-contact">Choose caller</label>
            <select
              id="caller-contact"
              value={selectedCallerId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedCallerId(value);
                const contact = contacts.find((item) => String(item.id) === value);
                if (contact) {
                  setCallerName(contact.name);
                }
              }}
            >
              {contacts.length === 0 && <option value="custom">No contacts saved</option>}
              {contacts.map((contact) => (
                <option key={contact.id} value={String(contact.id)}>
                  {contact.name} {contact.role ? `(${contact.role})` : ''}
                </option>
              ))}
              <option value="custom">Custom name</option>
            </select>
            {selectedCallerId === 'custom' && (
              <>
                <label className="feature-label" htmlFor="caller-name">Caller name</label>
                <input
                  id="caller-name"
                  value={callerName}
                  onChange={(event) => setCallerName(event.target.value)}
                  placeholder="Mom"
                />
              </>
            )}
            <label className="feature-label" htmlFor="call-delay">Delay before call, seconds</label>
            <input
              id="call-delay"
              type="number"
              min="0"
              max="60"
              value={callDelay}
              onChange={(event) => setCallDelay(event.target.value)}
            />
            <div className="feature-status">
              {fakeCallStage === 'idle' && 'Ready to trigger fake call'}
              {fakeCallStage === 'scheduled' && `Incoming call in ${callCountdown}s`}
              {fakeCallStage === 'ringing' && 'Incoming call ringing'}
              {fakeCallStage === 'accepted' && `Call active: ${callSeconds}s`}
            </div>
          </div>
          <p className="feature-click-count">Trigger clicks: {buttonClicks.fakeCall}</p>
          <div className="feature-actions">
            <button
              type="button"
              className="feature-btn"
              onClick={() => runButtonAction('fakeCall', triggerFakeCall)}
            >
              <PhoneCall size={18} />
              Trigger Fake Call
            </button>
            <button
              type="button"
              className="feature-btn secondary"
              onClick={() => runButtonAction('fakeCancel', rejectCall)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {(fakeCallStage === 'scheduled' || fakeCallStage === 'ringing' || fakeCallStage === 'accepted') && (
        <div className="fake-call-modal" role="dialog" aria-modal="true">
          <div className={`fake-call-content ${fakeCallStage}`}>
            <div className="call-top-status">
              <span>{fakeCallStage === 'accepted' ? 'Call in progress' : 'Incoming call'}</span>
              <strong>{fakeCallStage === 'accepted' ? `${callSeconds}s` : fakeCallStage === 'scheduled' ? `${callCountdown}s` : 'Ringing'}</strong>
            </div>
            <div className="caller-avatar">{fakeCaller.slice(0, 1).toUpperCase()}</div>
            <p className="fake-call-label">
              {fakeCallStage === 'scheduled' && `Incoming call in ${callCountdown}s`}
              {fakeCallStage === 'ringing' && 'Mobile'}
              {fakeCallStage === 'accepted' && `Connected ${callSeconds}s`}
            </p>
            <h3>{fakeCaller}</h3>
            <p>{fakeCallStage === 'accepted' ? '00:00 active conversation' : 'Swipe or tap to respond'}</p>
            <div className="call-actions">
              {fakeCallStage === 'ringing' && (
                <button
                  type="button"
                  className="answer-call"
                  onClick={() => runButtonAction('acceptCall', acceptCall)}
                  aria-label="Accept call"
                >
                  <PhoneCall size={26} />
                  <span>Accept</span>
                </button>
              )}
              <button
                type="button"
                className="decline-call"
                onClick={() => runButtonAction('rejectCall', rejectCall)}
                aria-label="Reject call"
              >
                <PhoneOff size={26} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {voicePopup && (
        <div className="voice-alert-modal" role="alertdialog" aria-modal="true">
          <div className="voice-alert-content">
            <AlertCircle size={44} />
            <h2>Voice SOS Alert</h2>
            <p>Emergency keyword detected. Your SOS alert is being sent now.</p>
            <button type="button" onClick={() => setVoicePopup(false)}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSafetyEnhanced;
