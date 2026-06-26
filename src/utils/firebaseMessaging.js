import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const getServiceWorkerUrl = () => {
  const params = new URLSearchParams(firebaseConfig);
  return `/firebase-messaging-sw.js?${params.toString()}`;
};

export const canUseFirebaseMessaging = () => {
  return hasFirebaseConfig && 'Notification' in window && 'serviceWorker' in navigator;
};

export const getBrowserFcmToken = async () => {
  if (!canUseFirebaseMessaging()) {
    throw new Error('Firebase web push is not configured.');
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error('Firebase messaging is not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const serviceWorkerRegistration = await navigator.serviceWorker.register(getServiceWorkerUrl());
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });

  if (!token) {
    throw new Error('Firebase did not return a device token.');
  }

  return token;
};

export const listenForForegroundMessages = async (handler) => {
  if (!canUseFirebaseMessaging()) return null;

  const supported = await isSupported();
  if (!supported) return null;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  return onMessage(messaging, handler);
};
