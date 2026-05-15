/**
 * Cloudflare Pages Functions - Firebase Config Endpoint
 * 
 * This function returns Firebase configuration from environment variables.
 * It allows the client-side app to fetch Firebase config securely.
 * 
 * Location: functions/api/firebase-config.js
 * Endpoint: /api/firebase-config
 */

export async function onRequest(context) {
  const { env } = context;
  
  // Return Firebase configuration from environment variables
  const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY || '',
    authDomain: env.FIREBASE_AUTH_DOMAIN || '',
    projectId: env.FIREBASE_PROJECT_ID || '',
    storageBucket: env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.FIREBASE_APP_ID || ''
  };
  
  return new Response(JSON.stringify(firebaseConfig), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
}
