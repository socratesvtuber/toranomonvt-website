/**
 * Firebase Member Loader for Toranomon VT Website
 * Fetches member data from Firebase Realtime Database and renders member pages dynamically.
 * Supports real-time updates via Firebase onValue listener.
 *
 * Usage:
 * 1. Include this script after firebase-config.js
 * 2. The script auto-initializes based on URL pattern
 */

// Prevent duplicate loading
if (window.firebaseMemberLoaderLoaded) {
  console.log('FirebaseMemberLoader: Already loaded, skipping duplicate load');
} else {
  window.firebaseMemberLoaderLoaded = true;

  // Global voice files array for the current member
  window.memberVoiceFiles = [];

  window.FirebaseMemberLoader = {
  // Firebase Realtime Database base URL
  firebaseUrl: null,
  
  // Current member data
  currentMember: null,
  
  // All members cache
  allMembers: {},
  
  // Firebase unsubscribe function
  unsubscribe: null,
  
  /**
   * Initialize the member loader
   * Detects if we're on a member page and loads data accordingly
   */
  async init() {
    console.log('FirebaseMemberLoader: Initializing...');
    
    // Get Firebase URL from config or meta tag
    this.firebaseUrl = this.getFirebaseUrl();
    
    if (!this.firebaseUrl) {
      console.error('FirebaseMemberLoader: Firebase URL not configured');
      this.showError('Firebase の設定が見つかりませんでした。');
      return false;
    }
    
    console.log('FirebaseMemberLoader: Firebase URL:', this.firebaseUrl);
    console.log('FirebaseMemberLoader: Current path:', window.location.pathname);
    console.log('FirebaseMemberLoader: Current search:', window.location.search);
  
    // Check URL pattern to determine page type
    // Match both member.html?id=... and direct member pages like yasahime.html
    // Also handle paths without .html extension (for dev servers/SPA routers)
    const memberMatch = window.location.pathname.match(/members\/([^/]+)(?:\.html)?$/);
    const idParam = this.getQueryParam('id');
    const nameParam = this.getQueryParam('name'); // Legacy support
    
    console.log('FirebaseMemberLoader: memberMatch:', memberMatch);
    console.log('FirebaseMemberLoader: idParam:', idParam);
    console.log('FirebaseMemberLoader: nameParam:', nameParam);
    
    // Extract member name from URL path (e.g., "夜叉姫" from "members/夜叉姫.html" or "members/夜叉姫")
    let pathMemberName = null;
    if (memberMatch && memberMatch[1] && memberMatch[1] !== 'member') {
    pathMemberName = decodeURIComponent(memberMatch[1]);
    }
    
    if (idParam) {
    // Dynamic member page with Firebase ID parameter (member.html?id=...)
    console.log('FirebaseMemberLoader: Loading member by ID:', idParam);
    await this.loadMemberById(idParam);
    } else if (nameParam) {
    // Legacy support: Load by name if ID not provided
    console.log('FirebaseMemberLoader: Loading member by name (legacy):', nameParam);
    await this.loadMemberByName(nameParam);
    } else if (pathMemberName) {
    // Direct member page (e.g., 夜叉姫.html or 夜叉姫)
    console.log('FirebaseMemberLoader: Loading member from path:', pathMemberName);
    await this.loadMemberByName(pathMemberName);
    } else {
    // No member page detected or no name specified
    console.log('FirebaseMemberLoader: No member page detected or no name specified');
    if (!memberMatch) {
    console.log('FirebaseMemberLoader: Not a member page');
    } else if (!idParam && !nameParam && !pathMemberName) {
    this.showError('メンバーが指定されていません。');
    }
    }
  
    return true;
  },
  
  /**
   * Get Firebase URL from config or meta tag
   * @returns {string|null} Firebase URL
   */
  getFirebaseUrl() {
    // Try global config first (set by firebase-config.js)
    if (typeof FIREBASE_DB_URL !== 'undefined' && FIREBASE_DB_URL) {
      return FIREBASE_DB_URL;
    }

    // Try meta tag
    const metaTag = document.querySelector('meta[name="env:FIREBASE_STORAGE_BUCKET"]');
    if (metaTag) {
      const bucket = metaTag.getAttribute('content');
      const projectId = bucket.replace('.firebaseio.com', '').replace('.appspot.com', '');
      return `https://${projectId}.firebaseio.com`;
    }

    // Try firebase-config.js global
    if (typeof FirebaseCounter !== 'undefined' && FirebaseCounter.db) {
      return FirebaseCounter.db;
    }

    // Fallback: try to get from FirebaseConfig if available
    if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.config && FirebaseConfig.config.projectId) {
      return `https://${FirebaseConfig.config.projectId}.firebaseio.com`;
    }

    return null;
  },
  
  /**
   * Get query parameter from URL
   * @param {string} param - Parameter name
   * @returns {string|null} Parameter value
   */
  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },
  
  /**
   * Load member data by Firebase ID
   * @param {string} memberId - Firebase ID to search for
   */
  async loadMemberById(memberId) {
  if (!this.firebaseUrl) {
  this.showError('Firebase が設定されていません。');
  return;
  }
  
  // Fetch specific member by ID directly
  const url = `${this.firebaseUrl}/form_submissions/${memberId}.json`;
  
  try {
  const response = await fetch(url);
  
  if (!response.ok) {
  if (response.status === 404) {
  this.showError('メンバーデータが見つかりませんでした。ID: ' + memberId);
  } else {
  throw new Error(`Failed to fetch data: ${response.status}`);
  }
  return;
  }
  
  const data = await response.json();
  
  if (!data) {
  this.showError('メンバーデータが見つかりませんでした。');
  return;
  }
  
  // Store and render
  const member = { id: memberId, ...data };
  this.currentMember = member;
  this.renderMemberPage(member);
  
  // Set up real-time listener for this member's data
  this.setupRealtimeListener(memberId);
  
  } catch (error) {
  console.error('FirebaseMemberLoader: Error loading member by ID:', error);
  if (error.message.includes('404')) {
  this.showError('メンバーデータが見つかりませんでした。ID: ' + memberId);
  } else {
  this.showError('データの読み込み中にエラーが発生しました：' + error.message);
  }
  }
  },
  
  /**
   * Load member data by name (hiragana or romaji) - Legacy support
   * @param {string} name - Member name to search for
   */
  async loadMemberByName(name) {
  if (!this.firebaseUrl) {
  this.showError('Firebase が設定されていません。');
  return;
  }
  
  const url = `${this.firebaseUrl}/form_submissions.json`;
  
  try {
  const response = await fetch(url);
  
  if (!response.ok) {
  if (response.status === 404) {
  this.showError('メンバーデータがまだ登録されていないか、Firebase にデータが存在しません。Google フォームからのデータ送信を実行してください。');
  } else {
  throw new Error(`Failed to fetch data: ${response.status}`);
  }
  return;
  }
  
  const data = await response.json();
  
  if (!data) {
  this.showError('メンバーデータが見つかりませんでした。');
  return;
  }
  
  // Find member by name
  const member = this.findMemberByName(name, data);
  
  if (!member) {
  this.showError(`メンバー「${name}」が見つかりませんでした。`);
  return;
  }
  
  // Store and render
  this.currentMember = member;
  this.allMembers = data;
  this.renderMemberPage(member);
  
  // Set up real-time listener for this member's data
  this.setupRealtimeListener(member.id);
  
  } catch (error) {
  console.error('FirebaseMemberLoader: Error loading member:', error);
  if (error.message.includes('404')) {
  this.showError('メンバーデータがまだ登録されていないか、Firebase にデータが存在しません。Google フォームからのデータ送信を実行してください。');
  } else {
  this.showError('データの読み込み中にエラーが発生しました：' + error.message);
  }
  }
  },
  
  /**
   * Find member by name in submissions data
   * If multiple members have the same name, return the one with the latest timestamp
   * @param {string} name - Name to search for
   * @param {Object} submissions - All submissions
   * @returns {Object|null} Member data or null
   */
  findMemberByName(name, submissions) {
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
   * Set up real-time listener for member data changes
   * @param {string} memberId - Member ID in Firebase
   */
  setupRealtimeListener(memberId) {
    // Unsubscribe from previous listener if exists
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // For simple REST API, we'll poll every 30 seconds
    const pollInterval = setInterval(() => {
      this.refreshMemberData(memberId);
    }, 30000); // 30 seconds
    
    this.unsubscribe = () => {
      clearInterval(pollInterval);
    };
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    });
  },
  
  /**
   * Refresh member data from Firebase
   * @param {string} memberId - Member ID
   */
  async refreshMemberData(memberId) {
    if (!this.firebaseUrl || !memberId) return;
    
    const url = `${this.firebaseUrl}/form_submissions/${memberId}.json`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data && JSON.stringify(data) !== JSON.stringify(this.currentMember)) {
        console.log('FirebaseMemberLoader: Data updated, re-rendering...');
        this.currentMember = { id: memberId, ...data };
        this.renderMemberPage(this.currentMember);
      }
    } catch (error) {
      console.error('FirebaseMemberLoader: Error refreshing data:', error);
    }
  },
  
  /**
   * Render member page with data
   * @param {Object} member - Member data
   */
  renderMemberPage(member) {
    console.log('FirebaseMemberLoader: Rendering member page:', member.name_hiragana);
    
    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('member-root').style.display = 'block';
    
    // Set page title
    const memberName = member.name_hiragana || member.name_romaji || 'メンバー';
    document.title = `${memberName} - 虎ノ門`;
    
    // Header
    document.getElementById('member-name-display').textContent = member.name_hiragana || '名前不明';
    document.getElementById('member-name-romaji').textContent = member.name_romaji || '';
    
    // Avatar
    const avatarEl = document.getElementById('member-avatar');
    if (member.fullbodyImageUrl) {
      avatarEl.src = this.getDriveImageProxy(member.fullbodyImageUrl);
      avatarEl.alt = member.name_hiragana || 'メンバー';
    }
    
    // Favorite button
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.dataset.memberId = member.id;
      favoriteBtn.dataset.name = member.name_hiragana || member.name_romaji || '';
      favoriteBtn.dataset.image = member.fullbodyImageUrl || '';
    }
    
    // SNS links
    this.renderSnsLinks(member.sns_link);
    
    // Basic info grid
    this.renderBasicInfo(member);
    
    // Catch copy (use unit_project_name or message_to_fans as fallback)
    document.getElementById('member-catchcopy').textContent = 
      member.unit_project_name || 'キャッチコピー';
    
    // Dream (use message_to_fans as fallback)
    document.getElementById('member-dream').textContent = 
      member.message_to_fans || '夢・目標';
    
    // Sushi mark
    document.getElementById('member-sushi-mark').textContent = 
      member.sushi_mark || '推しマーク';
    
    // Streaming terms
    this.renderStreamingTerms(member.streaming_language);
    
    // Unit project
    document.getElementById('member-unit-project').textContent = 
      member.unit_project_name || '';
    
    // Creator info
    this.renderCreatorInfo(member.illustrator, member.modeler_2d, member.modeler_3d);
    
    // Community info
    this.renderCommunityInfo(member.fan_name, member.official_hashtag);
    
    // Schedule
    document.getElementById('schedule-info').innerHTML = member.streaming_schedule 
      ? `<p>${this.escapeHtml(member.streaming_schedule)}</p>`
      : '<p>未定</p>';
    
    // Recommended videos
    this.renderRecommendedVideos(member.recommended_video);
    
    // Announcements
    document.getElementById('announcement-box').innerHTML = member.announcement_event
      ? `<p>${this.escapeHtml(member.announcement_event)}</p>`
      : '<p>お知らせはありません</p>';
    
    // Goods/music links
    this.renderGoodsMusicLinks(member.goods_music_link);
    
    // Message to fans
    document.getElementById('message-box').textContent = 
      member.message_to_fans || '';
    
    // Q&A
    this.renderQa(member.qa);
    
    // Voice buttons
    this.renderVoiceButtons(member.voiceAudioUrls);
    
    // Navigation
    this.renderNavigation(member);
    
    // Store voice files globally for playback
    window.memberVoiceFiles = member.voiceAudioUrls || [];
  },
  
  /**
   * Render SNS links
   */
  renderSnsLinks(snsLink) {
    const container = document.getElementById('sns-links');
    if (!container) return;
    
    if (snsLink) {
      container.innerHTML = `
        <a href="${this.escapeHtml(snsLink)}" class="sns-icon" title="SNS" target="_blank" rel="noopener">
          <i class="fas fa-link"></i>
        </a>
      `;
    } else {
      container.innerHTML = '<span class="no-data">登録されていません</span>';
    }
  },
  
  /**
   * Render basic info grid
   */
  renderBasicInfo(member) {
    const container = document.getElementById('member-info-grid');
    if (!container) return;
    
    const items = [
      { label: '名前（ひらがな）', value: member.name_hiragana },
      { label: '名前（ローマ字）', value: member.name_romaji },
      { label: '誕生日', value: member.birthday },
      { label: '初配信日', value: member.first_stream_date },
      { label: '身長', value: member.height },
      { label: 'イメージカラー', value: member.image_color, isColor: true },
    ];
    
    let html = '';
    items.forEach(item => {
      if (item.value) {
        html += `<dt>${item.label}</dt>`;
        if (item.isColor && typeof item.value === 'string') {
          const colorMatch = item.value.match(/#[0-9A-Fa-f]{6}/);
          const color = colorMatch ? colorMatch[0] : null;
          html += `<dd>${color ? `<span class="color-swatch" style="background-color: ${color};"></span>` : ''}${this.escapeHtml(item.value)}</dd>`;
        } else {
          html += `<dd>${this.escapeHtml(item.value)}</dd>`;
        }
      }
    });
    
    container.innerHTML = html || '<dd class="no-data">登録されていません</dd>';
  },
  
  /**
   * Render streaming terms
   */
  renderStreamingTerms(terms) {
    const container = document.getElementById('streaming-terms');
    if (!container) return;
    
    if (terms) {
      container.innerHTML = `<li>${this.escapeHtml(terms)}</li>`;
    } else {
      container.innerHTML = '<li class="no-data">登録されていません</li>';
    }
  },
  
  /**
   * Render creator info
   */
  renderCreatorInfo(illustrator, modeler2d, modeler3d) {
    const container = document.getElementById('creator-info');
    if (!container) return;
    
    let html = '';
    if (illustrator) {
      html += `<dt>イラストレーター</dt><dd>${this.escapeHtml(illustrator)}</dd>`;
    }
    if (modeler2d) {
      html += `<dt>2D モデラー</dt><dd>${this.escapeHtml(modeler2d)}</dd>`;
    }
    if (modeler3d) {
      html += `<dt>3D モデラー</dt><dd>${this.escapeHtml(modeler3d)}</dd>`;
    }
    
    container.innerHTML = html || '<dd class="no-data">登録されていません</dd>';
  },
  
  /**
   * Render community info
   */
  renderCommunityInfo(fanName, hashtag) {
    const container = document.getElementById('community-info');
    if (!container) return;
    
    let html = '';
    if (fanName) {
      html += `<dt>ファンネーム</dt><dd>${this.escapeHtml(fanName)}</dd>`;
    }
    if (hashtag) {
      html += `<dt>公式ハッシュタグ</dt><dd>${this.escapeHtml(hashtag)}</dd>`;
    }
    
    container.innerHTML = html || '<dd class="no-data">登録されていません</dd>';
  },
  
  /**
   * Render recommended videos
   */
  renderRecommendedVideos(video) {
    const container = document.getElementById('recommended-videos');
    if (!container) return;
    
    if (video) {
      const urls = video.split(/[\n,]/).map(v => v.trim()).filter(v => v);
      container.innerHTML = urls.map((url, i) => 
        `<li><a href="${this.escapeHtml(url)}" target="_blank" rel="noopener">動画${i + 1}</a></li>`
      ).join('');
    } else {
      container.innerHTML = '<li class="no-data">登録されていません</li>';
    }
  },
  
  /**
   * Render goods/music links
   */
  renderGoodsMusicLinks(link) {
    const container = document.getElementById('goods-music-links');
    if (!container) return;
    
    if (link) {
      container.innerHTML = `
        <a href="${this.escapeHtml(link)}" class="link-card" target="_blank" rel="noopener">
          <i class="fas fa-shopping-cart"></i>
          <span>グッズ・音楽</span>
        </a>
      `;
    } else {
      container.innerHTML = '<span class="no-data">登録されていません</span>';
    }
  },
  
  /**
   * Render Q&A
   */
  renderQa(qa) {
    const container = document.getElementById('qa-section');
    if (!container) return;
    
    if (qa) {
      // Split by newlines and create details/summary pairs
      const qaLines = qa.split('\n').filter(line => line.trim());
      if (qaLines.length > 0) {
        container.innerHTML = qaLines.map((line, i) => `
          <details>
            <summary>Q${i + 1}</summary>
            <p>${this.escapeHtml(line)}</p>
          </details>
        `).join('');
      } else {
        container.innerHTML = '<p class="no-data">登録されていません</p>';
      }
    } else {
      container.innerHTML = '<p class="no-data">登録されていません</p>';
    }
  },
  
  /**
   * Render voice buttons
   */
  renderVoiceButtons(voiceUrls) {
    const container = document.getElementById('voice-buttons-container');
    if (!container) return;
    
    if (voiceUrls && voiceUrls.length > 0) {
      container.innerHTML = voiceUrls.slice(0, 10).map((url, i) => 
        `<button class="voice-individual-btn" data-voice-index="${i}" style="padding: 6px 12px; font-size: 0.75rem; background: rgba(255, 184, 77, 0.15); border: 1px solid rgba(255, 184, 77, 0.3); border-radius: 8px; color: var(--text); cursor: pointer; transition: all 0.2s ease;">
          ボイス${i + 1}
        </button>`
      ).join('');
      
      // Store voice URLs globally
      window.memberVoiceFiles = voiceUrls;
    } else {
      container.innerHTML = '<span class="no-data">音声はありません</span>';
      window.memberVoiceFiles = [];
    }
  },
  
  /**
   * Render navigation between members
   */
  renderNavigation(currentMember) {
    const container = document.getElementById('member-nav');
    if (!container) return;
    
    // Get all public members
    const members = this.getPublicMembersList();
    const currentIndex = members.findIndex(m => m.id === currentMember.id);
    
    if (members.length <= 1) {
      container.innerHTML = '';
      return;
    }
    
    const prevMember = currentIndex > 0 ? members[currentIndex - 1] : members[members.length - 1];
    const nextMember = currentIndex < members.length - 1 ? members[currentIndex + 1] : members[0];
    
    container.innerHTML = `
    <a href="member.html?id=${encodeURIComponent(prevMember.id)}" class="nav-button prev-member">
    <i class="fas fa-arrow-right"></i>
    <span>${this.escapeHtml(prevMember.name_hiragana || prevMember.name_romaji || '')}</span>
    </a>
    <a href="member.html?id=${encodeURIComponent(nextMember.id)}" class="nav-button next-member">
    <span>${this.escapeHtml(nextMember.name_hiragana || nextMember.name_romaji || '')}</span>
    <i class="fas fa-arrow-right"></i>
    </a>
    `;
  },
  
  /**
   * Get list of public members
   */
  getPublicMembersList() {
    const members = [];
    
    for (const id in this.allMembers) {
      const member = this.allMembers[id];
      // Check if member should be displayed: "Web ページに公開する" means public
      if (member.public_flag === 'Web ページに公開する' || member.public_flag === '公開' || member.public_flag === true || member.public_flag === 'true') {
        members.push({ id, ...member });
      }
    }
    
    return members.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },
  
  /**
   * Get Google Drive image proxy URL
   */
  getDriveImageProxy(driveUrl) {
    if (!driveUrl) return '../img/虎ノ門ロゴ大本.png';
    
    const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return driveUrl;
  },
  
  /**
   * Escape HTML special characters
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  },
  
  /**
   * Show error state
   */
  showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('member-root').style.display = 'none';
    document.getElementById('error-message').textContent = message || '不明なエラーが発生しました。';
  }
};

// Note: Auto-initialization removed - initialization is now handled by member.html
// This prevents race conditions with Firebase config loading

} // End of duplicate prevention block
