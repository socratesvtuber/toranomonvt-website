// Firebase Configuration and Shared Counter
// Replace the placeholder config values with your actual Firebase project config
const FirebaseConfig = {
  firebase: null,
  db: null,
  
  // Initialize Firebase - YOU MUST REPLACE THESE VALUES WITH YOUR OWN
  // Get these from Firebase Console: https://console.firebase.google.com/
  config: {
    apiKey: "YOUR_API_KEY", // Replace with your API key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your project ID
    projectId: "YOUR_PROJECT_ID", // Replace with your project ID
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID", // Replace with your sender ID
    appId: "YOUR_APP_ID" // Replace with your app ID
  },

  async init() {
    // Load Firebase SDK from CDN
    if (typeof firebase === 'undefined') {
      await this.loadFirebaseSDK();
    }
    
    // Initialize Firebase
    try {
      firebase.initializeApp(this.config);
      this.db = firebase.firestore();
      return true;
    } catch (error) {
      console.warn('Firebase initialization failed. Using local fallback:', error);
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
    if (!this.db) {
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
    if (!this.db) {
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
    if (!this.db) {
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
