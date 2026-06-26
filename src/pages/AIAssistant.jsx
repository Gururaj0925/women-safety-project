import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Settings, ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '../App';
import '../styles/pages/aiAssistant.css';

const dangerWords = [
  'follow',
  'following',
  'unsafe',
  'danger',
  'scared',
  'stalking',
  'stalker',
  'harass',
  'harassing',
  'threat',
  'attack',
  'alone',
  'emergency',
  'help',
];

const getLocationLabel = (location) => {
  if (!location) return 'Location permission is not available yet.';
  return `Location detected near ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}.`;
};

const getSpeechRecognitionConstructor = () =>
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition;

const AIAssistant = () => {
  const user = getCurrentUser() || { name: 'User' };
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello, ${user.name}! I'm your AI safety assistant. Tell me what is happening, or use the microphone.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState(null);
  const [aiAssessment, setAiAssessment] = useState({
    level: 'Ready',
    details: 'Type or speak your situation. I will check danger words, night time, and location.',
  });
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const quickActions = [
    { label: 'I feel unsafe', marker: '!', action: 'unsafe' },
    { label: 'Someone is following me at night', marker: '!', action: 'following' },
    { label: 'Share my location', marker: '+', action: 'location' },
    { label: 'Find nearby police', marker: '+', action: 'police' },
    { label: 'Send emergency alert', marker: '!', action: 'emergency' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setLocation(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const analyzeSituation = (text) => {
    const normalized = text.trim().toLowerCase();
    const hour = new Date().getHours();
    const isNightNow = hour >= 19 || hour <= 5;
    const mentionsNight = /\b(night|dark|late|midnight)\b/.test(normalized);
    const mentionsFollowing = /\b(follow|following|stalk|stalking|chasing)\b/.test(normalized);
    const matchedDangerWords = dangerWords.filter((word) => normalized.includes(word));
    const score =
      matchedDangerWords.length +
      (isNightNow || mentionsNight ? 1 : 0) +
      (mentionsFollowing ? 2 : 0) +
      (location ? 1 : 0);
    const nearestPolice = location
      ? 'Nearest police station is about 500m away.'
      : 'Share location to find the nearest police station.';

    if (score >= 4) {
      return {
        level: 'High Risk',
        details: `${matchedDangerWords.length ? `Detected danger words: ${matchedDangerWords.slice(0, 4).join(', ')}. ` : ''}${isNightNow || mentionsNight ? 'Night-time risk detected. ' : ''}${getLocationLabel(location)}`,
        reply: `Your situation looks risky. I recommend activating SOS mode. ${nearestPolice} Move toward a bright public place and keep your phone ready.`,
      };
    }

    if (/\b(unsafe|scared|afraid|fear|help|danger)\b/.test(normalized)) {
      return {
        level: 'Medium Risk',
        details: `${matchedDangerWords.length ? `Detected safety concern: ${matchedDangerWords.slice(0, 3).join(', ')}. ` : ''}${getLocationLabel(location)}`,
        reply: 'I understand you feel unsafe. Do you want me to alert emergency contacts? I also recommend sharing your live location now.',
      };
    }

    if (/\b(share|send).*location\b|\bwhere am i\b|\bmy location\b|\bcurrent location\b/.test(normalized)) {
      return {
        level: 'Location Help',
        details: getLocationLabel(location),
        reply: 'I can help share your live location with trusted contacts. Open Live Location to send a link or copy it manually.',
      };
    }

    if (/\b(nearest|nearby|closest|find).*police\b|\bpolice station\b/.test(normalized)) {
      return {
        level: 'Police Help',
        details: getLocationLabel(location),
        reply: location
          ? 'Nearest police station is about 500m away. Open Police Stations to call them or start directions.'
          : 'Please allow location access so I can find the closest police station and directions.',
      };
    }

    return {
      level: 'Low Risk',
      details: matchedDangerWords.length ? `Detected: ${matchedDangerWords.join(', ')}.` : 'No immediate danger phrase detected.',
      reply: '',
    };
  };

  const generateAIResponse = (text) => {
    const normalized = text.trim().toLowerCase();
    const analysis = analyzeSituation(text);

    setAiAssessment({
      level: analysis.level,
      details: analysis.details,
    });

    if (analysis.reply) return analysis.reply;

    if (/\b(thank|thanks|thank you)\b/.test(normalized)) {
      return 'You are welcome. If you need anything else, I can help with location sharing, nearby police, safe routes, or sending an alert.';
    }

    if (/\b(safe route|route|navigation|directions|path)\b/.test(normalized)) {
      return 'I can suggest a safe route for you. Open the Safe Route page to compare safer and faster routes with directions.';
    }

    if (/\b(register|sign up|login|sign in|account)\b/.test(normalized)) {
      return 'You can register or login from the homepage. Once signed in, all safety features become available to you.';
    }

    if (/\b(calling|call police|contact police|phone police|dial police)\b/.test(normalized)) {
      return 'If you need immediate help, call the local emergency number now and move toward a safer public place.';
    }

    return 'I hear you. I can help with live location sharing, nearby police stations, safe routes, and emergency alerts. What would you like to do?';
  };

  const addConversation = (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: generateAIResponse(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  const handleQuickAction = (action, label) => {
    if (action === 'emergency') {
      setAiAssessment({
        level: 'High Risk',
        details: `${getLocationLabel(location)} Emergency alert recommended.`,
      });
    }

    addConversation(label);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addConversation(inputValue);
    setInputValue('');
  };

  const handleVoiceInput = () => {
    const BrowserSpeechRecognition = getSpeechRecognitionConstructor();

    if (!BrowserSpeechRecognition) {
      setAiAssessment({
        level: 'Voice Unavailable',
        details: 'This browser does not support speech recognition. Please type your message.',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new BrowserSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setAiAssessment({
        level: 'Listening',
        details: 'Speak clearly. I will place your words in the message box.',
      });
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInputValue(transcript);
      setAiAssessment({
        level: 'Voice Captured',
        details: transcript ? `Heard: "${transcript}"` : 'No speech was detected.',
      });
    };

    recognition.onerror = () => {
      setAiAssessment({
        level: 'Microphone Blocked',
        details: 'Allow microphone permission in the browser, or type your message.',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-header">
        <div className="header-content">
          <h1>AI Safety Assistant</h1>
          <p>Your 24/7 safety companion</p>
        </div>
        <button className="settings-btn" type="button" aria-label="Assistant settings">
          <Settings size={20} />
        </button>
      </div>

      <section className={`ai-reply-section ${aiAssessment.level === 'High Risk' ? 'danger' : ''}`}>
        <div className="reply-heading">
          <ShieldAlert size={18} />
          <span>AI Reply Section</span>
        </div>
        <h2>{aiAssessment.level}</h2>
        <p>{aiAssessment.details}</p>
      </section>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {message.sender === 'ai' && <span className="ai-avatar">AI</span>}
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="quick-actions-section">
          <p className="quick-actions-label">Quick Actions:</p>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="quick-action-item"
                onClick={() => handleQuickAction(action.action, action.label)}
                type="button"
              >
                <span className="action-emoji">{action.marker}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="input-section" onSubmit={handleSendMessage}>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Tell me what is happening..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="message-input"
          />
          <button
            type="button"
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceInput}
            aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <button type="submit" className="send-btn" disabled={!inputValue.trim()} aria-label="Send message">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
