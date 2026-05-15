/**
 * Environment Variable Loader for Cloudflare Pages
 * 
 * Cloudflare Pages では、環境変数がビルド時に HTML に埋め込まれます。
 * このスクリプトは、HTML 内のメタタグから環境変数を読み取ります。
 * 
 * For Cloudflare Pages setup:
 * 1. Go to your Pages project settings
 * 2. Navigate to "Environment variables"
 * 3. Add the following variables:
 *    - FIREBASE_API_KEY
 *    - FIREBASE_AUTH_DOMAIN
 *    - FIREBASE_PROJECT_ID
 *    - FIREBASE_STORAGE_BUCKET
 *    - FIREBASE_MESSAGING_SENDER_ID
 *    - FIREBASE_APP_ID
 * 4. These variables will be replaced at build time
 */

(function() {
  const env = {
    FIREBASE_API_KEY: '',
    FIREBASE_AUTH_DOMAIN: '',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_STORAGE_BUCKET: '',
    FIREBASE_MESSAGING_SENDER_ID: '',
    FIREBASE_APP_ID: ''
  };

  // Read from meta tags (set during build)
  document.querySelectorAll('meta[name^="env:"]').forEach(meta => {
    const name = meta.getAttribute('name').replace('env:', '').toUpperCase();
    const value = meta.getAttribute('content');
    if (env.hasOwnProperty(name)) {
      env[name] = value;
    }
  });

  // Make environment available globally
  window.CLOUDFLARE_ENV = env;
  
  // Debug logging (remove in production)
  console.log('🔧 Environment loaded:', {
    firebaseConfigured: !!(env.FIREBASE_API_KEY && env.FIREBASE_PROJECT_ID && !env.FIREBASE_API_KEY.includes('%'))
  });
})();
