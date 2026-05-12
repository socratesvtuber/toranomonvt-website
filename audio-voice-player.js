// Random Voice Player - Plays random voice audio on page load and navigation
(function() {
  // List of all voice files in the audio/voice directory
  const voiceFiles = [
    'audio/voice/kaka ちゃんセリフ 1.m4a',
    'audio/voice/かかホームページボイス 1.mp3',
    'audio/voice/スーパーファン感謝_20251111_1.m4a',
    'audio/voice/夜叉さんセリフ 1.m4a'
  ];

  // Track if audio has been played in this session to avoid repetition
  let lastPlayedIndex = -1;
  let hasUserInteracted = false;
  let currentAudio = null;

  // Get a random voice file (different from the last one)
  function getRandomVoice() {
    if (voiceFiles.length === 0) return null;
    if (voiceFiles.length === 1) return voiceFiles[0];

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * voiceFiles.length);
    } while (randomIndex === lastPlayedIndex && voiceFiles.length > 1);

    lastPlayedIndex = randomIndex;
    return voiceFiles[randomIndex];
  }

  // Stop current audio if playing
  function stopCurrentAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  }

  // Play a random voice with user interaction handling
  function playRandomVoice() {
    const voiceFile = getRandomVoice();
    if (!voiceFile) return;

    // Stop any currently playing audio
    stopCurrentAudio();

    // Create audio element
    const audio = new Audio(voiceFile);
    audio.preload = 'auto';
    audio.volume = 0.5; // Set volume to 50%
    currentAudio = audio;

    // Try to play immediately
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Auto-play was prevented, wait for user interaction
        console.log('Auto-play prevented, waiting for user interaction:', error.message);

        // Add one-time interaction listener
        if (!hasUserInteracted) {
          const playOnInteraction = () => {
            hasUserInteracted = true;
            if (currentAudio) {
              currentAudio.play().catch(e => console.log('Playback failed:', e));
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          };

          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('keydown', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
        }
      });
    }
  }

  // Initialize on page load
  function init() {
    // Play random voice on all pages
    playRandomVoice();
  }

  // Handle navigation (for SPA-like behavior or when pages are loaded dynamically)
  function setupNavigationListener() {
    // Listen for history changes (back/forward buttons)
    window.addEventListener('popstate', () => {
      setTimeout(playRandomVoice, 100);
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Setup navigation listener
  setupNavigationListener();

  // Expose stopCurrentAudio function globally for member pages to use
  window.stopCurrentAudio = stopCurrentAudio;
})();
