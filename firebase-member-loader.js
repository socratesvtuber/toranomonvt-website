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
  
    // Debug logging (uncomment if needed)
    // console.log('FirebaseMemberLoader: memberMatch:', memberMatch);
    // console.log('FirebaseMemberLoader: idParam:', idParam);
    // console.log('FirebaseMemberLoader: nameParam:', nameParam);
    
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

    // Fetch all members data first to populate allMembers cache
    const allMembersUrl = `${this.firebaseUrl}/form_submissions.json`;

    try {
      // First, fetch all members to populate allMembers
      const allResponse = await fetch(allMembersUrl);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        if (allData) {
          this.allMembers = allData;
        }
      }

      // Then fetch specific member by ID
      const url = `${this.firebaseUrl}/form_submissions/${memberId}.json`;
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

      // Debug: Log the raw data from Firebase
      console.log('DEBUG - Raw Firebase data for member ' + memberId + ':', JSON.stringify(data));
      console.log('DEBUG - headerImageUrl from DB:', data.headerImageUrl);
      console.log('DEBUG - fullbodyImageUrl from DB:', data.fullbodyImageUrl);

      // Store and render
      const member = { id: memberId, ...data };
      this.currentMember = member;
      
      // Update allMembers cache for getPublicMembersList() to work correctly
      this.allMembers[memberId] = data;
      
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

      // Compare data excluding the id property (which is added separately to currentMember)
      // Create a version of currentMember without the id for comparison
      const { id, ...currentMemberWithoutId } = this.currentMember || {};
      if (data && JSON.stringify(data) !== JSON.stringify(currentMemberWithoutId)) {
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
     console.log('DEBUG - Full member data:', JSON.stringify(member, null, 2));
     console.log('DEBUG - headerImageUrl:', member.headerImageUrl);
     console.log('DEBUG - fullbodyImageUrl:', member.fullbodyImageUrl);

     // Hide loading, show content
     document.getElementById('loading-state').style.display = 'none';
     document.getElementById('error-state').style.display = 'none';
     document.getElementById('member-root').style.display = 'block';

     // Set page title
     const memberName = member.name_hiragana || member.name_romaji || 'メンバー';
     document.title = `${memberName} - 虎ノ門`;

     // Header image (from headerImageUrl - Google Drive)
     const headerImageEl = document.getElementById('member-header-image');
     if (headerImageEl) {
       console.log('DEBUG - headerImageUrl value:', member.headerImageUrl);
       console.log('DEBUG - headerImageUrl type:', typeof member.headerImageUrl);
       if (member.headerImageUrl) {
         const proxyUrl = this.getDriveImageProxy(member.headerImageUrl);
         console.log('DEBUG - Setting header image:', proxyUrl);
         console.log('DEBUG - Original URL:', member.headerImageUrl);
         headerImageEl.src = proxyUrl;
         headerImageEl.style.display = 'block';
         headerImageEl.onerror = function() {
           console.error('DEBUG - Header image failed to load:', this.src);
         };
       } else {
         console.log('DEBUG - No headerImageUrl found');
         headerImageEl.style.display = 'none';
       }
     }

// Header text - use name_select with prefix removed, fallback to name_hiragana
      var displayName = '名前不明';
      if (member.name_select) {
        // Remove leading digits and underscore (e.g., "001_夜叉姫" -> "夜叉姫")
        var nameSelectMatch = member.name_select.match(/^\d+_(.*)$/);
        if (nameSelectMatch && nameSelectMatch[1]) {
          displayName = nameSelectMatch[1];
        } else {
          displayName = member.name_select;
        }
      } else if (member.name_hiragana) {
        displayName = member.name_hiragana;
      }
      document.getElementById('member-name-display').textContent = displayName;
      
      // Hide romaji as it's not needed
      var romajiEl = document.getElementById('member-name-romaji');
      if (romajiEl) {
        romajiEl.style.display = 'none';
      }

     // Avatar (from fullbodyImageUrl - Google Drive)
     const avatarEl = document.getElementById('member-avatar');
     console.log('DEBUG - fullbodyImageUrl value:', member.fullbodyImageUrl);
     console.log('DEBUG - fullbodyImageUrl type:', typeof member.fullbodyImageUrl);
     if (member.fullbodyImageUrl) {
       const proxyUrl = this.getDriveImageProxy(member.fullbodyImageUrl);
       console.log('DEBUG - Setting avatar image:', proxyUrl);
       console.log('DEBUG - Original URL:', member.fullbodyImageUrl);
       avatarEl.src = proxyUrl;
       avatarEl.alt = member.name_hiragana || 'メンバー';
       avatarEl.onerror = function() {
         console.error('DEBUG - Avatar image failed to load:', this.src);
       };
     } else {
       console.log('DEBUG - No fullbodyImageUrl found, using fallback');
       avatarEl.src = '../img/虎ノ門ロゴ大本.png';
       avatarEl.alt = 'メンバー画像';
     }

     // Favorite button
     const favoriteBtn = document.getElementById('favorite-btn');
     if (favoriteBtn) {
       favoriteBtn.dataset.memberId = member.id;
       favoriteBtn.dataset.name = member.name_hiragana || member.name_romaji || '';
       favoriteBtn.dataset.image = member.fullbodyImageUrl || '';
     }
     // Costume navigation links
     const costumeNavUl = document.querySelector('.costume-nav ul');
     if (costumeNavUl) {
       let linksHtml = '';
       // Costume links
       if (member.outerImageUrls && member.outerImageUrls.length > 0) {
         for (let i = 0; i < member.outerImageUrls.length; i++) {
           linksHtml += `<li><a href="#" data-type="costume" data-index="${i}">衣装${i + 1}</a></li>`;
         }
       }
       // Three-view link
       linksHtml += `<li><a href="#" data-type="three-view">三面図</a></li>`;
       // Concept link
       linksHtml += `<li><a href="#" data-type="concept">コンセプト</a></li>`;
       costumeNavUl.innerHTML = linksHtml;

       // Click handler to change avatar image
       const loaderInstance = this;
       costumeNavUl.addEventListener('click', function(e) {
         e.preventDefault();
         const link = e.target.closest('a');
         if (!link) return;
         const type = link.dataset.type;
         let url = null;
         if (type === 'costume') {
           const index = parseInt(link.dataset.index, 10);
           url = member.outerImageUrls[index];
         } else if (type === 'three-view') {
           url = member.threeViewImageUrl;
         } else if (type === 'concept') {
           url = member.conceptImageUrl;
         }
         if (url) {
           const proxyUrl = loaderInstance.getDriveImageProxy(url);
           avatarEl.src = proxyUrl;
           avatarEl.alt = member.name_hiragana || 'メンバー';
         }
       });
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
  
    // Oshi mark
    document.getElementById('member-sushi-mark').textContent =
    member.oshi_mark || '推しマーク';
  
    // Streaming terms
    this.renderStreamingTerms(member.streaming_terms);
  
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
    
    // Navigation (prev/next member links)
    this.renderNavigation(member);
    
    // Voice buttons - render iframe player
    this.renderVoiceButtons(member.voiceAudioUrls);
    
    // Store costume/test-image URLs globally for nav click handling
    window.memberCostumeNav = {
      outerImageUrls: member.outerImageUrls || [],
      threeViewImageUrl: member.threeViewImageUrl || '',
      conceptImageUrl: member.conceptImageUrl || '',
      fullbodyImageUrl: member.fullbodyImageUrl || '',
      name_hiragana: member.name_hiragana || 'メンバー'
    };
  },
  
  /**
   * Render SNS links
   * @param {string} snsLink - SNS links (can be multiple URLs separated by newlines or commas)
   */
  renderSnsLinks(snsLink) {
    const container = document.getElementById('sns-links');
    if (!container) return;

    if (snsLink) {
      // Split by newlines or commas
      const urls = snsLink.split(/[\n,]/).map(url => url.trim()).filter(url => url);
      
      if (urls.length > 0) {
        container.innerHTML = urls.map(url => {
          const platform = this.getPlatformInfo(url);
          return `
            <a href="${this.escapeHtml(url)}" class="sns-icon ${platform.class}" title="${platform.name}" target="_blank" rel="noopener">
              <i class="${platform.icon}"></i>
            </a>
          `;
        }).join('');
      } else {
        container.innerHTML = '<span class="no-data">登録されていません</span>';
      }
    } else {
      container.innerHTML = '<span class="no-data">登録されていません</span>';
    }
  },

  /**
   * Get platform info based on URL
   * @param {string} url - URL to check
   * @returns {{class: string, name: string, icon: string}} Platform info
   */
  getPlatformInfo(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return { class: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' };
    } else if (urlLower.includes('twitch.tv')) {
      return { class: 'twitch', name: 'Twitch', icon: 'fab fa-twitch' };
    } else if (urlLower.includes('nicovideo.jp') || urlLower.includes('nico.ms')) {
      return { class: 'niconico', name: 'ニコニコ動画', icon: 'fas fa-tv' };
    } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || urlLower.includes('/twitter/')) {
      return { class: 'x', name: 'X (Twitter)', icon: 'fa-brands fa-x-twitter' };
    } else if (urlLower.includes('instagram.com')) {
      return { class: 'instagram', name: 'Instagram', icon: 'fab fa-instagram' };
    } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
      return { class: 'facebook', name: 'Facebook', icon: 'fab fa-facebook' };
    } else if (urlLower.includes('tiktok.com')) {
      return { class: 'tiktok', name: 'TikTok', icon: 'fab fa-tiktok' };
    } else if (urlLower.includes('discord.gg') || urlLower.includes('discord.com')) {
      return { class: 'discord', name: 'Discord', icon: 'fab fa-discord' };
    } else if (urlLower.includes('note.com') || urlLower.includes('/note/')) {
      return { class: 'note', name: 'note', icon: 'fas fa-pen-fancy' };
    } else if (urlLower.includes('pixiv.net')) {
      return { class: 'pixiv', name: 'pixiv', icon: 'fas fa-palette' };
    } else if (urlLower.includes('booth.pm')) {
      return { class: 'booth', name: 'BOOTH', icon: 'fas fa-store' };
    } else if (urlLower.includes('spotify.com')) {
      return { class: 'spotify', name: 'Spotify', icon: 'fab fa-spotify' };
    } else if (urlLower.includes('apple.com')) {
      return { class: 'apple', name: 'Apple', icon: 'fab fa-apple' };
    } else if (urlLower.includes('amazon')) {
      return { class: 'amazon', name: 'Amazon', icon: 'fab fa-amazon' };
    } else if (urlLower.includes('marshmallow-qa.com') || urlLower.includes('marshmallow-qa')) {
      return { class: 'marshmallow', name: 'marshmallow', icon: 'fas fa-cookie' };
    } else if (urlLower.includes('lit.link') || urlLower.includes('litlink')) {
      return { class: 'litlink', name: 'Lit-Link', icon: 'fas fa-link' };
    } else {
      return { class: 'other', name: 'リンク', icon: 'fas fa-link' };
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
   * Parses Q&A pairs from the database where questions start with Q/QA/質問 and answers start with A/回答
   * @param {string} qa - Q&A text from database
   */
  renderQa(qa) {
    const container = document.getElementById('qa-section');
    if (!container) return;

    if (qa) {
      const qaPairs = this.parseQaPairs(qa);
      
      if (qaPairs.length > 0) {
        container.innerHTML = qaPairs.map((pair, i) => `
        <details>
          <summary>${this.escapeHtml(pair.question)}</summary>
          <p>${this.escapeHtml(pair.answer)}</p>
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
   * Parse Q&A pairs from text
   * Each Q&A pair should have a question line (starting with Q) and an answer line (starting with A)
   * @param {string} qa - Raw Q&A text from database
   * @returns {Array<{question: string, answer: string}>} Array of Q&A pairs
   */
  parseQaPairs(qa) {
    if (!qa || typeof qa !== 'string') return [];

    const lines = qa.split('\n').map(line => line.trim()).filter(line => line);
    const pairs = [];
    let currentQuestion = null;
    let currentAnswer = null;

    for (const line of lines) {
      // Check if this is a question line (starts with Q, Q., QA., 質問，etc.)
      const isQuestion = /^Q[.:]?\s*|^QA[.:]?\s*|^質問/.test(line);
      // Check if this is an answer line (starts with A, A., 回答，etc.)
      const isAnswer = /^A[.:]?\s*|^回答/.test(line);

      if (isQuestion) {
        // If we have a pending question without an answer, save it
        if (currentQuestion && currentAnswer === null) {
          pairs.push({ question: currentQuestion, answer: '回答未入力' });
        }
        // Start a new question
        currentQuestion = line.replace(/^Q[.:]?\s*|^QA[.:]?\s*|^質問\s*/, '').trim();
        currentAnswer = null;
      } else if (isAnswer) {
        // This is an answer - attach to current question
        if (currentQuestion) {
          currentAnswer = line.replace(/^A[.:]?\s*|^回答\s*/, '').trim();
          pairs.push({ question: currentQuestion, answer: currentAnswer });
          currentQuestion = null;
          currentAnswer = null;
        }
      } else {
        // This is a continuation line
        if (currentQuestion && !currentAnswer) {
          // Continuation of question
          currentQuestion += ' ' + line;
        } else if (currentAnswer) {
          // Continuation of answer
          currentAnswer += ' ' + line;
        }
      }
    }

    // Handle any remaining question without an answer
    if (currentQuestion && currentAnswer === null) {
      pairs.push({ question: currentQuestion, answer: '回答未入力' });
    }

    return pairs;
  },
  
/**
    * Render voice buttons
    * Displays up to 10 voice buttons with cropped play icons from Google Drive iframe
    */
    renderVoiceButtons(voiceUrls) {
      const container = document.getElementById('voice-player-container');
      
      if (voiceUrls && voiceUrls.length > 0) {
        const voiceCount = Math.min(voiceUrls.length, 10);
        let buttonsHtml = '';
        
        for (let i = 0; i < voiceCount; i++) {
          const voiceUrl = voiceUrls[i];
          const previewUrl = this.getVoicePreviewUrl(voiceUrl) || voiceUrl;
          
          buttonsHtml += `<div class="voice-btn-wrapper" style="display: inline-flex; flex-direction: column; align-items: center; margin: 0 8px 12px 0;">
            <div class="play-button-crop" data-voice-index="${i}" data-voice-url="${this.escapeHtml(previewUrl)}" style="width: 50px; height: 30px; overflow: hidden; position: relative; cursor: pointer; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); background-color: #000;">
              <iframe src="${previewUrl}" scrolling="no" style="position: absolute; width: 500px; height: 300px; top: -128px; left: -82px; border: none;"></iframe>
            </div>
            <span style="color: var(--muted); font-size: 0.8rem; margin-top: 4px;">ボイス${i + 1}</span>
          </div>`;
        }
        
        container.innerHTML = `<h4 style="color: var(--accent); margin: 8px 0 6px 0; font-size: 0.95rem;">音声ファイル</h4>
          <div class="voice-buttons-row" style="display: flex; flex-wrap: wrap;">${buttonsHtml}</div>
          <div class="voice-player-dynamic" style="margin-top: 8px; display: none;"></div>`;
        container.style.display = 'block';
        
        // Add click handlers for play buttons
        container.querySelectorAll('.play-button-crop').forEach(btn => {
          btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.voiceIndex);
            const voiceUrl = voiceUrls[idx];
            const playerContainer = container.parentElement.querySelector('.voice-player-dynamic');
            
            if (playerContainer) {
              playerContainer.style.display = 'block';
              if (window.FirebaseMemberLoader.isFirebaseStorageUrl(voiceUrl)) {
                playerContainer.innerHTML = `<audio controls style="width: 100%;" autoplay>
                  <source src="${voiceUrl}" type="audio/mpeg">
                  <source src="${voiceUrl}" type="audio/mp4">
                </audio>`;
              } else {
                const previewUrl = window.FirebaseMemberLoader.getVoicePreviewUrl(voiceUrl);
                playerContainer.innerHTML = `<iframe src="${previewUrl || voiceUrl}" style="width: 100%; height: 80px; border: none; border-radius: 6px;" allowfullscreen></iframe>`;
              }
            }
          });
        });
      } else {
        if (container) {
          container.style.display = 'none';
        }
      }
    },
  
  /**
   * Render navigation between members
   */
  renderNavigation(currentMember) {
    const container = document.getElementById('member-nav');
    console.log('DEBUG renderNavigation: container found:', !!container);
    if (!container) return;
  
    // Get all public members sorted by name_select (first 3 digits)
    const members = this.getPublicMembersList();
    console.log('DEBUG renderNavigation: members count:', members.length);
    console.log('DEBUG renderNavigation: members:', members.map(m => ({ id: m.id, name: m.name_hiragana, name_select: m.name_select })));
    
    const currentIndex = members.findIndex(m => m.id === currentMember.id);
    console.log('DEBUG renderNavigation: currentMember.id:', currentMember.id);
    console.log('DEBUG renderNavigation: currentIndex:', currentIndex);
  
    if (members.length === 0) {
      console.log('DEBUG renderNavigation: no members, returning');
      container.innerHTML = '';
      return;
    }
  
    // Handle single member case - no navigation needed (don't show link to self)
    if (members.length === 1) {
      console.log('DEBUG renderNavigation: single member case - no navigation needed');
      container.innerHTML = '';
      return;
    }
  
    // Handle multiple members case - prev/next navigation
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : members.length - 1;
    const nextIndex = currentIndex < members.length - 1 ? currentIndex + 1 : 0;
    const prevMember = members[prevIndex];
    const nextMember = members[nextIndex];
    
    console.log('DEBUG renderNavigation: prevMember:', prevMember.name_hiragana, 'nextMember:', nextMember.name_hiragana);
  
    container.innerHTML = `
    <a href="member.html?id=${encodeURIComponent(prevMember.id)}" class="nav-button prev-member">
    <i class="fas fa-arrow-left"></i>
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
      // Check if member should be displayed: normalize by removing spaces
      const flag = (member.public_flag || '').toString().replace(/\s/g, '');
      // Use includes() for robust matching regardless of encoding differences
      if (flag.includes('Web') && flag.includes('公開') ||
      flag === '公開する' || flag === '公開' || flag === 'true') {
        members.push({ id, ...member });
      }
    }
  
    // Sort by name_select (first 3 digits) in ascending order
    return members.sort((a, b) => {
      const aSelect = a.name_select || '';
      const bSelect = b.name_select || '';
      const aNum = parseInt(aSelect.substring(0, 3), 10) || 0;
      const bNum = parseInt(bSelect.substring(0, 3), 10) || 0;
      return aNum - bNum;
    });
  },
  
/**
    * Get Google Drive image proxy URL
    */
  getDriveImageProxy(driveUrl) {
    if (!driveUrl) return '../img/虎ノ門ロゴ大本.png';

    // Handle /file/d/FILE_ID/view format - convert to lh3.googleusercontent.com proxy format
    const fileMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      const fileId = fileMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Handle uc?export=FORMAT&id=FILE_ID format - extract ID and convert to proxy format
    const idMatch = driveUrl.match(/(uc\?export=[^&]+)&id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      const fileId = idMatch[2];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Handle uc?id=FILE_ID format - extract ID and convert to proxy format
    const simpleMatch = driveUrl.match(/uc\?id=([a-zA-Z0-9_-]+)/);
    if (simpleMatch) {
      const fileId = simpleMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return driveUrl;
  },

/**
    * Get Google Drive voice preview URL (for iframe embedding)
    * Handles both /file/d/FILE_ID/view and uc?export=download&id=FILE_ID formats
    */
  getVoicePreviewUrl(driveUrl) {
    if (!driveUrl) return '';
    
    // Handle /file/d/FILE_ID/view format (Google Drive share URL)
    const fileMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }
    
    // Handle uc?export=FORMAT&id=FILE_ID format (direct download URL)
    const idMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
    }
    
    return '';
  },
  
  /**
    * Check if URL is Firebase Storage format
    */
  isFirebaseStorageUrl(url) {
    return url && url.includes('firebasestorage.googleapis.com');
  },

  /**
   * Escape HTML special characters
   */
   escapeHtml(str) {
     if (!str) return '';
     return String(str)
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
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
