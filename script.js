// Milestone Counter - Tracks visitor count and plays voice on milestones
// Uses Firebase for shared counter across all users
const MilestoneCounter = {
  // Default milestone interval (every 100 visitors)
  milestoneInterval: 100,

  // Special milestones with custom voices - loaded from config file
  specialMilestones: [],

  storageKey: 'toranomon_visitor_count',
  milestoneStorageKey: 'toranomon_last_milestone',
  visitedKey: 'toranomon_has_visited',
  firebaseEnabled: false,
  configLoaded: false,

  // Load milestone configuration from JSON file
  async loadConfig() {
    if (this.configLoaded) return;

    try {
      const response = await fetch('/milestone-config.json');
      if (!response.ok) {
        throw new Error('Failed to load milestone config');
      }
      const config = await response.json();

      this.milestoneInterval = config.milestoneInterval || 100;
      this.specialMilestones = config.specialMilestones || [];
      this.configLoaded = true;

      console.log('Milestone config loaded:', config);
    } catch (error) {
      console.warn('Failed to load milestone config, using defaults:', error);
      // Use default values if config fails
      this.milestoneInterval = 100;
      this.specialMilestones = [
        { count: 1, voice: 'audio/voice/スーパーファン感謝_20251111_1.m4a', message: '🎉 初訪問ありがとうございます！' },
        { count: 100, voice: 'audio/voice/kaka ちゃんセリフ 1.m4a', message: '🎊 100 回記念！ありがとうございます！' },
        { count: 500, voice: 'audio/voice/夜叉さんセリフ 1.m4a', message: '🎊 500 回記念！ありがとうございます！' },
        { count: 1000, voice: 'audio/voice/スーパーファン感謝_20251111_1.m4a', message: '🎊 1000 回記念！ありがとうございます！' },
        { count: 5000, voice: 'audio/voice/kaka ちゃんセリフ 1.m4a', message: '🎊 5000 回記念！ありがとうございます！' },
        { count: 10000, voice: 'audio/voice/夜叉さんセリフ 1.m4a', message: '🎊 10000 回記念！ありがとうございます！' }
      ];
      this.configLoaded = true;
    }
  },

  async init() {
    console.log('MilestoneCounter.init() called');

    // Load milestone configuration
    await this.loadConfig();

    // Initialize Firebase for shared counter
    if (typeof FirebaseCounter !== 'undefined') {
      this.firebaseEnabled = await FirebaseCounter.init();
      console.log('Firebase initialized:', this.firebaseEnabled);
    }

    // Only run on homepage
    console.log('Is home page:', this.isHomePage());
    if (!this.isHomePage()) return;

    // Only increment if this is the first visit in this session
    console.log('Has visited this session:', this.hasVisitedThisSession());
    if (!this.hasVisitedThisSession()) {
      console.log('Incrementing count...');
      await this.incrementCount();
      this.setHasVisitedThisSession();
      console.log('Count incremented and session flag set');
    } else {
      console.log('Skipping increment - already visited this session');
    }

    await this.updateDisplay();
    this.checkMilestone();
  },

  hasVisitedThisSession() {
    return sessionStorage.getItem(this.visitedKey) === 'true';
  },

  setHasVisitedThisSession() {
    sessionStorage.setItem(this.visitedKey, 'true');
  },

  isHomePage() {
    return window.location.pathname === '/' ||
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname === '';
  },

  async getCount() {
    if (this.firebaseEnabled && typeof FirebaseCounter !== 'undefined') {
      return await FirebaseCounter.getVisitCount();
    }
    // Fallback to local storage
    const stored = localStorage.getItem(this.storageKey);
    return stored ? parseInt(stored, 10) : 0;
  },

  async incrementCount() {
    if (this.firebaseEnabled && typeof FirebaseCounter !== 'undefined') {
      await FirebaseCounter.incrementVisitCount();
    } else {
      // Fallback to local storage
      const currentCount = await this.getCount();
      const newCount = currentCount + 1;
      localStorage.setItem(this.storageKey, newCount.toString());
    }
  },

  getLastMilestone() {
    const stored = localStorage.getItem(this.milestoneStorageKey);
    return stored ? parseInt(stored, 10) : 0;
  },

  setLastMilestone(value) {
    localStorage.setItem(this.milestoneStorageKey, value.toString());
  },

  getNextMilestone(current) {
    const interval = this.milestoneInterval;
    return Math.ceil(current / interval) * interval;
  },

  async updateDisplay() {
    const countEl = document.getElementById('milestone-count');
    const targetEl = document.getElementById('milestone-target');

    if (!countEl) return;

    const count = await this.getCount();
    const nextMilestone = this.getNextMilestone(count);

    countEl.textContent = count.toLocaleString();

    if (targetEl) {
      targetEl.textContent = nextMilestone.toLocaleString();
    }
  },

  checkMilestone() {
    const count = this.getCount();
    const lastMilestone = this.getLastMilestone();
    const currentMilestone = Math.floor(count / this.milestoneInterval) * this.milestoneInterval;

    // Check for special milestones
    const specialMilestone = this.specialMilestones.find(m => m.count === count);
    if (specialMilestone && lastMilestone !== specialMilestone.count) {
      this.celebrateSpecialMilestone(specialMilestone);
      this.setLastMilestone(specialMilestone.count);
      return;
    }

    // Check if we've reached a new regular milestone
    if (currentMilestone > 0 && currentMilestone !== lastMilestone) {
      this.celebrateMilestone(currentMilestone);
      this.setLastMilestone(currentMilestone);
    }
  },

  celebrateSpecialMilestone(milestone) {
    const counterEl = document.getElementById('milestone-counter');

    // Add celebration animation
    if (counterEl) {
      counterEl.classList.add('milestone-celebration');
      setTimeout(() => counterEl.classList.remove('milestone-celebration'), 500);
    }

    // Play special voice
    this.playSpecialVoice(milestone.voice, milestone.message);
  },

  celebrateMilestone(milestone) {
    const counterEl = document.getElementById('milestone-counter');

    // Add celebration animation
    if (counterEl) {
      counterEl.classList.add('milestone-celebration');
      setTimeout(() => counterEl.classList.remove('milestone-celebration'), 500);
    }

    // Play milestone voice
    this.playMilestoneVoice(milestone);
  },

  playSpecialVoice(voiceFile, message) {
    // Create and play audio
    const audio = new Audio(voiceFile);
    audio.preload = 'auto';

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Special milestone voice playback prevented:', error.message);

        // Try to play on user interaction
        const playOnInteraction = () => {
          audio.play().catch(e => console.log('Special milestone voice playback failed:', e));
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('keydown', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('keydown', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });
      });
    }

    // Show special notification
    this.showSpecialMilestoneNotification(message);
  },

  playMilestoneVoice(milestone) {
    // List of milestone celebration voices
    const milestoneVoices = [
      'audio/voice/スーパーファン感謝_20251111_1.m4a',
      'audio/voice/kaka ちゃんセリフ 1.m4a',
      'audio/voice/夜叉さんセリフ 1.m4a'
    ];

    // Select a random voice
    const voiceIndex = Math.floor(Math.random() * milestoneVoices.length);
    const voiceFile = milestoneVoices[voiceIndex];

    // Create and play audio
    const audio = new Audio(voiceFile);
    audio.preload = 'auto';

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Milestone voice playback prevented:', error.message);

        // Try to play on user interaction
        const playOnInteraction = () => {
          audio.play().catch(e => console.log('Milestone voice playback failed:', e));
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('keydown', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('keydown', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });
      });
    }

    // Show notification
    this.showMilestoneNotification(milestone);
  },

  showSpecialMilestoneNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'milestone-notification milestone-notification-special';
    notification.innerHTML = `
      <div class="milestone-notification-content">
        <span class="milestone-notification-icon">🎊</span>
        <span class="milestone-notification-text">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('milestone-notification-show');
    });

    // Remove after animation
    setTimeout(() => {
      notification.classList.remove('milestone-notification-show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  showMilestoneNotification(milestone) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'milestone-notification';
    notification.innerHTML = `
      <div class="milestone-notification-content">
        <span class="milestone-notification-icon">🎉</span>
        <span class="milestone-notification-text">${milestone} visitors milestone reached!</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('milestone-notification-show');
    });

    // Remove after animation
    setTimeout(() => {
      notification.classList.remove('milestone-notification-show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// Initialize milestone counter
document.addEventListener('DOMContentLoaded', async () => {
  await MilestoneCounter.init();

  const heroButton = document.querySelector('.button-primary');
  if (heroButton) {
    heroButton.addEventListener('click', () => {
      heroButton.blur();
    });
  }
});
