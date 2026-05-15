// Firebase Configuration and Shared Counter
// Uses Cloudflare Pages Functions to fetch Firebase config securely
// Environment variables are managed via Cloudflare Dashboard

const FirebaseConfig = {
  firebase: null,
  db: null,
  config: null,
  initialized: false,

  // Fetch config from Cloudflare Pages Functions
  async fetchConfig() {
    try {
      const response = await fetch('/api/firebase-config');
      if (!response.ok) {
        throw new Error('Failed to fetch Firebase config');
      }
      this.config = await response.json();
      return this.config;
    } catch (error) {
      console.warn('Failed to fetch Firebase config from server:', error);
      return null;
    }
  },

  async init() {
    // Try to fetch config from Cloudflare Pages Functions first
    const serverConfig = await this.fetchConfig();
    
    if (!serverConfig || !serverConfig.apiKey || serverConfig.apiKey === '') {
      console.warn('⚠️ Firebase config not available. Using local fallback.');
      console.warn('Please set up environment variables in Cloudflare Pages Dashboard.');
      return false;
    }

    this.config = serverConfig;

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
