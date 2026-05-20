/**
 * Firebase Data Loader for Toranomon VT Website
 * Fetches form submission data from Firebase Realtime Database
 * and displays it on the website member pages.
 * 
 * Usage:
 * 1. Include this script after firebase-config.js
 * 2. Call MemberDataLoader.load() to fetch and display data
 */

const MemberDataLoader = {
  // Firebase Realtime Database base URL
  firebaseUrl: null,
  
  // Data cache
  cache: null,
  
  // Cache expiry time (5 minutes)
  cacheExpiry: 300000,
  
  /**
   * Initialize the data loader
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    console.log('MemberDataLoader: Initializing...');
    
    // Get Firebase URL from config
    if (typeof FIREBASE_DB_URL !== 'undefined') {
      this.firebaseUrl = FIREBASE_DB_URL;
    } else {
      // Fallback: try to get from meta tag
      const metaTag = document.querySelector('meta[name="env:FIREBASE_STORAGE_BUCKET"]');
      if (metaTag) {
        const projectId = metaTag.getAttribute('content').replace('.firebaseio.com', '');
        this.firebaseUrl = `https://${projectId}.firebaseio.com`;
      }
    }
    
    if (!this.firebaseUrl) {
      console.error('MemberDataLoader: Firebase URL not configured');
      return false;
    }
    
    console.log('MemberDataLoader: Firebase URL:', this.firebaseUrl);
    return true;
  },
  
  /**
   * Load all submissions from Firebase
   * @returns {Promise<Object>} Submission data
   */
  async loadAllSubmissions() {
    if (!this.firebaseUrl) {
      await this.init();
    }
    
    const url = `${this.firebaseUrl}/form_submissions.json`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data) {
        return {};
      }
      
      return data;
    } catch (error) {
      console.error('MemberDataLoader: Error loading submissions:', error);
      return {};
    }
  },
  
  /**
   * Load submission by ID
   * @param {string} id - Submission ID
   * @returns {Promise<Object>} Submission data
   */
  async loadSubmissionById(id) {
    if (!this.firebaseUrl) {
      await this.init();
    }
    
    const url = `${this.firebaseUrl}/form_submissions/${id}.json`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MemberDataLoader: Error loading submission:', error);
      return null;
    }
  },
  
  /**
   * Get all members with public_flag set to display
   * @param {Object} submissions - All submissions
   * @returns {Array} Array of public member data
   */
  getPublicMembers(submissions) {
    if (!submissions) return [];
    
    const publicMembers = [];
    
    for (const id in submissions) {
      const member = submissions[id];
  
      // Check if member should be displayed: "Web ページに公開する" means public
      if (member.public_flag === 'Web ページに公開する' || member.public_flag === '公開' || member.public_flag === true || member.public_flag === 'true') {
        publicMembers.push({
          id,
          ...member
        });
      }
    }
    
    // Sort by timestamp (newest first)
    publicMembers.sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
    
    return publicMembers;
  },
  
  /**
   * Get member by name (hiragana or romaji)
   * If multiple members have the same name, return the one with the latest timestamp
   * @param {string} name - Name to search for
   * @param {Object} submissions - All submissions
   * @returns {Object|null} Member data or null
   */
  getMemberByName(name, submissions) {
    if (!submissions || !name) return null;
  
    const normalizedName = name.toLowerCase().trim();
    let latestMember = null;
    let latestTimestamp = 0;
  
    for (const id in submissions) {
      const member = submissions[id];
  
      const hiragana = member.name_hiragana ? member.name_hiragana.toLowerCase().trim() : '';
      const romaji = member.name_romaji ? member.name_romaji.toLowerCase().trim() : '';
  
      if (hiragana === normalizedName || romaji === normalizedName) {
        // If multiple members have the same name, keep the one with the latest timestamp
        const memberTimestamp = member.timestamp || 0;
        if (memberTimestamp > latestTimestamp) {
          latestTimestamp = memberTimestamp;
          latestMember = { id, ...member };
        }
      }
    }
  
    return latestMember;
  },
  
  /**
   * Render member data to page
   * @param {Object} member - Member data
   * @param {string} containerId - Container element ID
   */
  renderMember(member, containerId = 'member-content') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error('MemberDataLoader: Container not found:', containerId);
      return;
    }
    
    if (!member) {
      container.innerHTML = '<p class="member-not-found">メンバー情報が見つかりませんでした。</p>';
      return;
    }
    
    // Build HTML
    const html = `
      <div class="member-profile">
        ${member.headerImageUrl ? `
          <div class="member-header">
            <img src="${this.getDriveImageProxy(member.headerImageUrl)}" alt="ヘッダー画像" class="member-header-image">
          </div>
        ` : ''}
        
        <div class="member-main">
          ${member.fullbodyImageUrl ? `
            <div class="member-avatar">
              <img src="${this.getDriveImageProxy(member.fullbodyImageUrl)}" alt="${member.name_hiragana || 'メンバー'}" class="member-avatar-image">
            </div>
          ` : ''}
          
          <div class="member-info">
            <h2 class="member-name">
              ${member.name_hiragana ? `<span class="name-hiragana">${member.name_hiragana}</span>` : ''}
              ${member.name_romaji ? `<span class="name-romaji">${member.name_romaji}</span>` : ''}
            </h2>
            
            ${member.name_select ? `<p class="name-display">${member.name_select}</p>` : ''}
            
            ${member.sns_link ? `
              <a href="${member.sns_link}" target="_blank" rel="noopener" class="sns-link">
                SNS を見る
              </a>
            ` : ''}
            
            <dl class="member-details">
              ${member.birthday ? `<dt>誕生日</dt><dd>${member.birthday}</dd>` : ''}
              ${member.first_stream_date ? `<dt>初配信日</dt><dd>${member.first_stream_date}</dd>` : ''}
              ${member.height ? `<dt>身長</dt><dd>${member.height}</dd>` : ''}
              ${member.image_color ? `<dt>イメージカラー</dt><dd>${member.image_color}</dd>` : ''}
              ${member.sushi_mark ? `<dt>推しマーク</dt><dd>${member.sushi_mark}</dd>` : ''}
              ${member.streaming_language ? `<dt>配信用語</dt><dd>${member.streaming_language}</dd>` : ''}
              ${member.unit_project_name ? `<dt>ユニット・プロジェクト名</dt><dd>${member.unit_project_name}</dd>` : ''}
              ${member.illustrator ? `<dt>イラストレーター</dt><dd>${member.illustrator}</dd>` : ''}
              ${member.modeler_2d ? `<dt>2D モデラー</dt><dd>${member.modeler_2d}</dd>` : ''}
              ${member.modeler_3d ? `<dt>3D モデラー</dt><dd>${member.modeler_3d}</dd>` : ''}
              ${member.fan_name ? `<dt>ファンネーム</dt><dd>${member.fan_name}</dd>` : ''}
              ${member.official_hashtag ? `<dt>公式ハッシュタグ</dt><dd>${member.official_hashtag}</dd>` : ''}
            </dl>
            
            ${member.streaming_schedule ? `
              <div class="member-section">
                <h3>配信予定</h3>
                <p>${member.streaming_schedule}</p>
              </div>
            ` : ''}
            
            ${member.recommended_video ? `
              <div class="member-section">
                <h3>オススメ動画</h3>
                <p><a href="${member.recommended_video}" target="_blank" rel="noopener">動画を見る</a></p>
              </div>
            ` : ''}
            
            ${member.announcement_event ? `
              <div class="member-section">
                <h3>お知らせ・イベント予定</h3>
                <p>${member.announcement_event}</p>
              </div>
            ` : ''}
            
            ${member.goods_music_link ? `
              <div class="member-section">
                <h3>グッズ・音楽配信</h3>
                <p><a href="${member.goods_music_link}" target="_blank" rel="noopener">リンクを見る</a></p>
              </div>
            ` : ''}
            
            ${member.message_to_fans ? `
              <div class="member-section message-to-fans">
                <h3>ファンへ一言</h3>
                <p>${member.message_to_fans}</p>
              </div>
            ` : ''}
            
            ${member.qa ? `
              <div class="member-section qa">
                <h3>Q＆A</h3>
                <p>${member.qa}</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${member.voiceAudioUrls && member.voiceAudioUrls.length > 0 ? `
          <div class="member-audio">
            <h3>ボイス</h3>
            ${member.voiceAudioUrls.map(url => `
              <audio controls class="voice-audio">
                <source src="${url}" type="audio/mp4">
                お使いのブラウザは音声再生に対応していません。
              </audio>
            `).join('')}
          </div>
        ` : ''}
        
        ${member.videoUrl ? `
          <div class="member-video">
            <h3>動画</h3>
            <video controls class="member-video-player">
              <source src="${member.videoUrl}" type="video/mp4">
              お使いのブラウザは動画再生に対応していません。
            </video>
          </div>
        ` : ''}
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  /**
   * Get Google Drive image proxy URL
   * @param {string} driveUrl - Google Drive share URL
   * @returns {string} Proxy URL for direct image access
   */
  getDriveImageProxy(driveUrl) {
    if (!driveUrl) return '';
    
    // Extract file ID from Google Drive URL
    const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return driveUrl;
  },
  
  /**
   * Load and display member data for current page
   */
  async load() {
    console.log('MemberDataLoader: Loading member data...');
    
    try {
      const initialized = await this.init();
      
      if (!initialized) {
        console.error('MemberDataLoader: Failed to initialize');
        return;
      }
      
      const submissions = await this.loadAllSubmissions();
      
      if (!submissions || Object.keys(submissions).length === 0) {
        console.log('MemberDataLoader: No submissions found');
        return;
      }
      
      // Store in cache
      this.cache = {
        data: submissions,
        timestamp: Date.now()
      };
      
      console.log('MemberDataLoader: Loaded', Object.keys(submissions).length, 'submissions');
      
      // Check if we're on a member page and auto-render
      this.autoRenderMemberPage(submissions);
      
    } catch (error) {
      console.error('MemberDataLoader: Error loading data:', error);
    }
  },
  
  /**
   * Auto-render member page if on member page
   * @param {Object} submissions - All submissions
   */
  autoRenderMemberPage(submissions) {
    // Check if we're on a member page
    const memberPageMatch = window.location.pathname.match(/members\/([^/]+)\.html/);
    
    if (memberPageMatch) {
      const memberName = memberPageMatch[1];
      const member = this.getMemberByName(memberName, submissions);
      
      if (member) {
        this.renderMember(member, 'member-content');
      }
    }
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    MemberDataLoader.load();
  });
}
