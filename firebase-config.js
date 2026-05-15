// Firebase Configuration and Shared Counter
// ============================================
// IMPORTANT: Replace the placeholder values below with your actual Firebase project config.
// To get your Firebase config:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select your project (or create a new one)
// 3. Click the gear icon ⚙️ next to "Project Overview" → "Project settings"
// 4. Scroll to "Your apps" section → Click "</>" (Web) to add a web app
// 5. Copy the firebaseConfig values and paste them below

const FirebaseConfig = {
  firebase: null,
  db: null,
  config: {
    // ============================================
    // 🔧 FIREBASE CONFIGURATION - REPLACE THESE VALUES
    // ============================================
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // ← Replace with your API key
    authDomain: "your-project-id.firebaseapp.com", // ← Replace with your project ID
    projectId: "your-project-id", // ← Replace with your project ID
    storageBucket: "your-project-id.appspot.com", // ← Replace with your project ID
    messagingSenderId: "123456789012", // ← Replace with your sender ID
    appId: "1:123456789012:web:abcdef1234567890" // ← Replace with your app ID
    // ============================================
  },
  initialized: false,

  async init() {
    // Check if config is properly set
    const cfg = this.config;
    if (!cfg.apiKey || cfg.apiKey.includes('YOUR_') || cfg.apiKey === 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
      console.warn('⚠️ Firebase config not set. Using local fallback.');
      console.warn('Please replace placeholder values in firebase-config.js with your actual Firebase config.');
      return false;
    }

    // Load Firebase SDK from CDN
    if (typeof firebase === 'undefined') {
      await this.loadFirebaseSDK();
    }

    // Initialize Firebase
    try {
      firebase.initializeApp(this.config);
      this.db = firebase.firestore();
      this.initialized = true;
      console.log('✅ Firebase initialized successfully');
      return true;
    } catch (error) {
      console.warn('❌ Firebase initialization failed. Using local fallback:', error);
      return false;
    }
  },

  loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
      script.onload = () => {
        const firestore = document.createElement('script');
        firestore.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
        firestore.onload = resolve;
        firestore.onerror = reject;
        document.head.appendChild(firestore);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // Shared counter functions
  async incrementVisitCount() {
    if (!this.db || !this.initialized) {
      // Fallback to local storage
      return this.localIncrement();
    }

    try {
      const counterRef = this.db.collection('counters').doc('visitor_count');

      // Use Firebase transaction for atomic increment
      await counterRef.transaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        if (doc.exists) {
          return { count: doc.data().count + 1, lastUpdated: Date.now() };
        } else {
          return { count: 1, lastUpdated: Date.now() };
        }
      });

      return this.getVisitCount();
    } catch (error) {
      console.warn('Firebase increment failed, using local fallback:', error);
      return this.localIncrement();
    }
  },

  async getVisitCount() {
    if (!this.db || !this.initialized) {
      // Fallback to local storage
      return this.localGetCount();
    }

    try {
      const counterRef = this.db.collection('counters').doc('visitor_count');
      const doc = await counterRef.get();

      if (doc.exists) {
        return doc.data().count;
      } else {
        // Initialize counter if it doesn't exist
        await counterRef.set({ count: 0, lastUpdated: Date.now() });
        return 0;
      }
    } catch (error) {
      console.warn('Firebase get count failed, using local fallback:', error);
      return this.localGetCount();
    }
  },

  // Local storage fallback functions
  localIncrement() {
    const current = parseInt(localStorage.getItem('toranomon_visitor_count') || '0', 10);
    const newCount = current + 1;
    localStorage.setItem('toranomon_visitor_count', newCount.toString());
    return newCount;
  },

  localGetCount() {
    return parseInt(localStorage.getItem('toranomon_visitor_count') || '0', 10);
  },

  // Listen for real-time updates
  onCountUpdate(callback) {
    if (!this.db || !this.initialized) {
      // Fallback: poll local storage
      let lastCount = this.localGetCount();
      const interval = setInterval(() => {
        const currentCount = this.localGetCount();
        if (currentCount !== lastCount) {
          lastCount = currentCount;
          callback(currentCount);
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    const counterRef = this.db.collection('counters').doc('visitor_count');
    const unsubscribe = counterRef.onSnapshot((doc) => {
      if (doc.exists) {
        callback(doc.data().count);
      }
    });

    return unsubscribe;
  }
};

// Export for use in other scripts
window.FirebaseCounter = FirebaseConfig;
