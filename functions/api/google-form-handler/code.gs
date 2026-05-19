/**
 * Google Form Submission Handler for Toranomon VT Website
 * Stores form responses in Firebase Realtime Database
 *
 * Setup Instructions:
 * 1. Copy config.gs.example to config.gs
 * 2. Fill in your Firebase and Google Drive credentials
 * 3. Set up form trigger: onFormSubmit function
 */

// ============================================
// Field Mapping - Questions mapped by indexOf matching
// The key is the field name, the value is the question text to match
// Based on Google Form header: Timestamp, Email Address, and form fields
// ============================================
var FIELD_DEFINITIONS = {
  // Core identification fields
  'name_select': 'あなたの名前をプルダウンから選択して下さい。 ※ここをミスるとデータが破壊されるので絶対間違えないで下さい！',
  'sns_link': 'SNS リンク 自身が活動している SNS などの URL のみを記入。 複数ある場合は改行して追加すること。',
  'name_hiragana': '名前（ひらがな）',
  'name_romaji': '名前（ローマ字）',
  'birthday': '誕生日',
  'first_stream_date': '初配信日',
  'height': '身長',
  'image_color': 'イメージカラー（カラーコードを記入）',
  'sushi_mark': '推しマーク',
  'streaming_language': '配信用語 複数ある場合は改行して追加すること。',
  'unit_project_name': 'ユニット・プロジェクト名',
  'illustrator': 'イラストレーター',
  'modeler_2d': '2D モデラー',
  'modeler_3d': '3D モデラー',
  'fan_name': 'ファンネーム',
  'official_hashtag': '公式ハッシュタグ',
  'streaming_schedule': '配信予定',
  'recommended_video': 'オススメ動画（投稿済みの動画サイトの URL を記入。）',
  'announcement_event': 'お知らせ・イベント予定 複数ある場合は改行して追加すること。',
  'goods_music_link': 'グッズ・音楽配信サイトリンク 複数ある場合は改行して追加すること',
  'message_to_fans': 'ファンへ一言',
  'qa': 'Q＆A 質問と回答をそれぞれ一行で記入すること 質問の冒頭に「Q.」 回答の冒頭に「A.」をつけること 例： Q.他のメンバーとの関係は？ A.深い絆で結ばれた戦友たち。一緒に虎ノ門を盛り上げています。 複数質問がある場合は改行して追加すること',
  
  // File upload fields
  'header_image': 'Web に公開するヘッダー画像をアップして下さい。 （1 ファイル 10MB まで）',
  'header_image_alt': 'ヘッダー画像',
  'fullbody_image': 'Web に公開する全身画像をアップして下さい。 （1 ファイル 10MB まで）',
  'fullbody_image_alt': '全身画像',
  'voice_audio': '自己紹介ページで再生されるボイスをアップして下さい。 1 番目にアップしたものが基本のボイスになります。 （1 ファイル 10MB まで）',
  'video': '自己紹介ページに動画を流したい場合はアップして下さい。（1 ファイル 100MB まで）',
  
  // Public flag field
  'public_flag': 'Web ページへの公開可否フラグ 外部に公開せず内容だけ予め他投稿したい場合は「非公開」、公開しても問題ない場合は「公開」を選択。 ※自己紹介ページの内容は Google フォームの編集用 URL から修正できます。予め内容を入力しておいてデビュー時に公開フラグだけ更新してもよいです。',
  'public_flag_display': 'Web ページに公開する',
  'public_flag_private': '非公開'
};

// Required fields list (必須項目)
// Based on the form: name_hiragana, name_romaji, header_image, fullbody_image, public_flag are required
var REQUIRED_FIELD_KEYS = [
  'name_hiragana',
  'name_romaji',
  'header_image',
  'fullbody_image',
  'public_flag'
];

// File upload fields - matches the exact question text in FIELD_DEFINITIONS
var FILE_UPLOAD_FIELDS = {
  'header_image': 'Web に公開するヘッダー画像をアップして下さい。 （1 ファイル 10MB まで）',
  'header_image_alt': 'ヘッダー画像',
  'fullbody_image': 'Web に公開する全身画像をアップして下さい。 （1 ファイル 10MB まで）',
  'fullbody_image_alt': '全身画像',
  'voice_audio': '自己紹介ページで再生されるボイスをアップして下さい。 1 番目にアップしたものが基本のボイスになります。 （1 ファイル 10MB まで）',
  'video': '自己紹介ページに動画を流したい場合はアップして下さい。（1 ファイル 100MB まで）'
};

/**
 * Main function: Called when Google Form is submitted
 * @param {Object} e - Form submission event object
 */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();

  try {
    // Wait for lock to prevent concurrent executions
    lock.waitLock(30000);

    Logger.log('========================================');
    Logger.log('=== Form Submission Started ===');
    Logger.log('Timestamp: ' + new Date().toISOString());
    Logger.log('========================================');

    // Validate event object
    if (!e || !e.response) {
      Logger.log('ERROR: Invalid event object - e or e.response is null/undefined');
      Logger.log('Event object: ' + JSON.stringify(e));
      throw new Error('Invalid event object');
    }

    // Get form response
    var formResponse = e.response;
    var itemResponses = formResponse.getItemResponses();

    Logger.log('Form Response ID: ' + formResponse.getId());
    Logger.log('Number of item responses: ' + itemResponses.length);
    Logger.log('========================================');

    // Initialize result object with all fields as null
    var result = initializeResultObject();

    // Parse each item response using indexOf matching
    for (var i = 0; i < itemResponses.length; i++) {
      var itemResponse = itemResponses[i];
      var item = itemResponse.getItem();
      var title = item.getTitle();
      var responseType = item.getType();
      var response = itemResponse.getResponse();

      Logger.log('--- Processing Item ' + (i + 1) + ' ---');
      Logger.log(' Title: ' + title);
      Logger.log(' Response Type: ' + responseType);
      Logger.log(' Response: ' + (response ? (response.length > 100 ? response.substring(0, 100) + '...' : response) : 'null'));

      // Use indexOf to find matching field
      var matchedField = findMatchingField(title);

      if (matchedField) {
        Logger.log(' Matched Field: ' + matchedField);

        // Handle file uploads separately
        if (isFileUploadField(matchedField)) {
          Logger.log(' Handling as file upload field');
          handleFileUpload(result, matchedField, item, formResponse);
        } else {
          // Handle regular text responses
          result[matchedField] = formatResponse(response);
          Logger.log(' Set value: ' + result[matchedField]);
        }
      } else {
        Logger.log(' WARNING: No matching field found for this title');
      }
    }

    Logger.log('========================================');
    Logger.log('=== Parsed Data Summary ===');

    // Add metadata
    result.submittedAt = new Date().toISOString();
    result.formSubmissionId = formResponse.getId();
    result.formResponseId = formResponse.getRespondentEmail() || 'anonymous';
    result.timestamp = Date.now();

    // Log key fields
    Logger.log('Name (Hiragana): ' + result.name_hiragana);
    Logger.log('Name (Romaji): ' + result.name_romaji);
    Logger.log('Public Flag: ' + result.public_flag);
    Logger.log('Header Image URL: ' + (result.headerImageUrl ? 'Set' : 'Not set'));
    Logger.log('Fullbody Image URL: ' + (result.fullbodyImageUrl ? 'Set' : 'Not set'));
    Logger.log('Voice Audio Count: ' + (result.voiceAudioUrls ? result.voiceAudioUrls.length : 0));
    Logger.log('Video URL: ' + (result.videoUrl ? 'Set' : 'Not set'));

    // Check required fields
    Logger.log('========================================');
    Logger.log('=== Required Fields Check ===');
    var missingRequired = [];
    if (!result.name_hiragana) missingRequired.push('name_hiragana');
    if (!result.name_romaji) missingRequired.push('name_romaji');
    if (!result.public_flag) missingRequired.push('public_flag');

    if (missingRequired.length > 0) {
      Logger.log('WARNING: Missing required fields: ' + missingRequired.join(', '));
    } else {
      Logger.log('All required fields are present');
    }

    // Store in Firebase
    Logger.log('========================================');
    Logger.log('=== Storing in Firebase ===');
    var firebaseResult = storeInFirebase(result);

    Logger.log('========================================');
    Logger.log('=== Form Submission Completed Successfully ===');
    Logger.log('Firebase ID: ' + firebaseResult.id);
    Logger.log('Firebase URL: ' + FIREBASE_DB_URL + '/form_submissions/' + firebaseResult.id);
    Logger.log('========================================');

    return {
      success: true,
      firebaseId: firebaseResult.id,
      message: 'Data stored successfully in Firebase'
    };

  } catch (error) {
    Logger.log('========================================');
    Logger.log('=== ERROR OCCURRED ===');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + (error.stack || 'No stack trace available'));
    Logger.log('========================================');

    // store error in Firebase for debugging
    storeErrorInFirebase(error, e);

    return {
      success: false,
      error: error.toString(),
      stack: error.stack || 'No stack trace available'
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Initialize result object with all fields set to null
 * @returns {Object} Initialized result object
 */
function initializeResultObject() {
  var result = {};

  // Set all field keys to null initially
  for (var key in FIELD_DEFINITIONS) {
    result[key] = null;
  }

  // Add file URL fields
  result.headerImageUrl = null;
  result.fullbodyImageUrl = null;
  result.voiceAudioUrls = [];
  result.videoUrl = null;

  return result;
}

/**
 * Find matching field key using indexOf
 * Prioritizes longer, more specific matches to avoid false positives
 * @param {String} title - Field title from form
 * @returns {String|null} Matching field key or null
 */
function findMatchingField(title) {
  if (!title) return null;

  var titleStr = String(title).trim();
  var bestMatch = null;
  var bestMatchLength = 0;

  // First pass: Look for exact or long matches (4+ chars)
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    
    // Skip very short field titles (less than 4 chars) in first pass to avoid false matches
    if (fieldTitle.length < 4) {
      continue;
    }

    // Check if form title contains the field title (exact match preferred)
    if (titleStr.indexOf(fieldTitle) !== -1) {
      // Prefer longer matches
      if (fieldTitle.length > bestMatchLength) {
        bestMatch = fieldKey;
        bestMatchLength = fieldTitle.length;
      }
    }
  }
  
  if (bestMatch) {
    return bestMatch;
  }

  // Second pass: Check short field titles only if no long match found
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    
    // Only check short field titles
    if (fieldTitle.length >= 4) {
      continue;
    }

    // Check if form title contains the field title
    if (titleStr.indexOf(fieldTitle) !== -1) {
      return fieldKey;
    }
  }

  // Third pass: Check if field title contains the form title (for truncated titles)
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];

    if (fieldTitle.indexOf(titleStr) !== -1) {
      return fieldKey;
    }
  }

  return null;
}

/**
 * Check if a field is a file upload field
 * @param {String} fieldKey - Field key to check
 * @returns {Boolean} True if file upload field
 */
function isFileUploadField(fieldKey) {
  return FILE_UPLOAD_FIELDS.hasOwnProperty(fieldKey);
}

/**
 * Format response based on type
 * @param {*} response - Response value
 * @returns {String|null} Formatted response
 */
function formatResponse(response) {
  if (response === null || response === undefined || response === '') {
    return null;
  }

  if (response instanceof Array) {
    return response.join(', ');
  }

  return String(response);
}

/**
 * Handle file upload field
 * @param {Object} result - Result object to update
 * @param {String} fieldKey - Field key
 * @param {Object} item - Form item
 * @param {Object} formResponse - Form response object
 */
function handleFileUpload(result, fieldKey, item, formResponse) {
  try {
    var itemResponses = formResponse.getItemResponses();

    for (var i = 0; i < itemResponses.length; i++) {
      var itemResponse = itemResponses[i];
      var responseItem = itemResponse.getItem();

      // Match item using indexOf
      if (responseItem.getTitle() && responseItem.getTitle().indexOf(FILE_UPLOAD_FIELDS[fieldKey]) !== -1) {
        var response = itemResponse.getResponse();

        Logger.log(' Field: ' + fieldKey + ', Response type: ' + typeof response);
        Logger.log(' Response: ' + JSON.stringify(response));

        if (response && response.length > 0) {
          if (fieldKey === 'voice_audio') {
            // Handle multiple audio files (0-10 files)
            result.voiceAudioUrls = [];
            for (var j = 0; j < response.length; j++) {
              var fileId = null;
              var shareUrl = null;
              
              // Get file ID from response
              if (response[j] && typeof response[j] === 'object' && typeof response[j].getId === 'function') {
                fileId = response[j].getId();
              } else if (response[j] && typeof response[j] === 'string') {
                fileId = response[j];
                Logger.log(' String file ID detected: ' + fileId);
              } else {
                Logger.log(' Warning: response[j] is not a valid file object: ' + JSON.stringify(response[j]));
                continue;
              }
              
              // Construct Google Drive share URL directly from file ID
              shareUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
              Logger.log(' Constructed share URL: ' + shareUrl);
              result.voiceAudioUrls.push(shareUrl);
            }
            Logger.log(' Processed ' + result.voiceAudioUrls.length + ' voice audio files');
          } else {
            // Handle single file uploads
            var fileId = null;
            var shareUrl = null;
            
            // Get file ID from response
            if (response[0] && typeof response[0] === 'object' && typeof response[0].getId === 'function') {
              fileId = response[0].getId();
            } else if (response[0] && typeof response[0] === 'string') {
              fileId = response[0];
              Logger.log(' String file ID detected: ' + fileId);
            } else {
              Logger.log(' Warning: response[0] is not a valid file object: ' + JSON.stringify(response[0]));
            }
            
            if (fileId) {
              // Construct Google Drive share URL directly from file ID
              shareUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
              Logger.log(' File ID: ' + fileId);
              Logger.log(' Share URL: ' + shareUrl);

              if (fieldKey === 'header_image') {
                result.headerImageUrl = shareUrl;
              } else if (fieldKey === 'fullbody_image') {
                result.fullbodyImageUrl = shareUrl;
              } else if (fieldKey === 'video') {
                result.videoUrl = shareUrl;
              }
            }
          }
        }
        break;
      }
    }
  } catch (error) {
    Logger.log('ERROR handling file upload for ' + fieldKey + ': ' + error.toString());
    throw error;
  }
}

/**
 * Store data in Firebase Realtime Database
 * @param {Object} data - Data to store
 * @returns {Object} Result with ID
 */
function storeInFirebase(data) {
  var url = FIREBASE_DB_URL + '/form_submissions.json';

  Logger.log('Firebase URL: ' + url);
  Logger.log('Checking Firebase configuration...');
  Logger.log(' FIREBASE_DB_URL: ' + FIREBASE_DB_URL);

  // Validate Firebase URL
  if (!FIREBASE_DB_URL || FIREBASE_DB_URL.indexOf('YOUR_') !== -1 || FIREBASE_DB_URL.indexOf('your-') !== -1) {
    Logger.log('ERROR: Firebase URL is not configured properly!');
    Logger.log('Please copy config.gs.example to config.gs and fill in your Firebase credentials.');
    throw new Error('Firebase URL not configured. Please check config.gs file.');
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(data),
    'muteHttpExceptions': true
  };

  Logger.log('Sending POST request to Firebase...');

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();

  Logger.log('Firebase Response Code: ' + responseCode);

  if (responseCode >= 400) {
    Logger.log('ERROR: Firebase returned error code ' + responseCode);
    Logger.log('Response: ' + responseText);
    throw new Error('Firebase error: ' + responseCode + ' - ' + responseText);
  }

  var result = JSON.parse(responseText);

  Logger.log('Successfully stored in Firebase');
  Logger.log('Response name (ID): ' + result.name);

  return {
    id: result.name,
    data: result
  };
}

/**
 * Store error information in Firebase for debugging
 * @param {Error} error - Error object
 * @param {Object} e - Form submission event
 */
function storeErrorInFirebase(error, e) {
  try {
    var errorData = {
      error: error.toString(),
      errorStack: error.stack || 'No stack trace available',
      timestamp: new Date().toISOString(),
      eventData: e ? {
        responseId: e.response ? e.response.getId() : null,
        values: e.values
      } : null
    };

    var url = FIREBASE_DB_URL + '/form_errors.json';

    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(errorData),
      'muteHttpExceptions': true
    };

    Logger.log('Storing error in Firebase: ' + url);
    UrlFetchApp.fetch(url, options);
  } catch (storeError) {
    Logger.log('Failed to store error in Firebase: ' + storeError.toString());
  }
}

/**
 * Test function to verify Firebase connection
 * @returns {Object} Test result
 */
function testFirebaseConnection() {
  Logger.log('=== Testing Firebase Connection ===');

  // Check configuration
  if (!FIREBASE_DB_URL || FIREBASE_DB_URL.indexOf('YOUR_') !== -1 || FIREBASE_DB_URL.indexOf('your-') !== -1) {
    Logger.log('ERROR: Firebase URL is not configured!');
    Logger.log('Current FIREBASE_DB_URL: ' + FIREBASE_DB_URL);
    return {
      success: false,
      message: 'Firebase URL not configured. Please check config.gs file.',
      firebaseUrl: FIREBASE_DB_URL
    };
  }

  var testData = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Firebase connection test from Toranomon VT Google Form Handler'
  };

  try {
    var result = storeInFirebase(testData);
    Logger.log('=== Firebase Connection Test Successful ===');
    return {
      success: true,
      message: 'Connection successful',
      firebaseId: result.id,
      firebaseUrl: FIREBASE_DB_URL
    };
  } catch (error) {
    Logger.log('=== Firebase Connection Test Failed ===');
    Logger.log('Error: ' + error.toString());
    return {
      success: false,
      message: 'Connection failed: ' + error.toString(),
      firebaseUrl: FIREBASE_DB_URL
    };
  }
}

/**
 * Get all submissions from Firebase (for admin)
 * @returns {Object} All submissions
 */
function getAllSubmissions() {
  var url = FIREBASE_DB_URL + '/form_submissions.json';

  var options = {
    'method': 'get',
    'muteHttpExceptions': true
  };

  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

/**
 * Get submission by ID
 * @param {String} id - Submission ID
 * @returns {Object} Submission data
 */
function getSubmissionById(id) {
  var url = FIREBASE_DB_URL + '/form_submissions/' + id + '.json';

  var options = {
    'method': 'get',
    'muteHttpExceptions': true
  };

  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

/**
 * Delete submission by ID
 * @param {String} id - Submission ID
 * @returns {Object} Delete result
 */
function deleteSubmission(id) {
  var url = FIREBASE_DB_URL + '/form_submissions/' + id + '.json';

  var options = {
    'method': 'delete',
    'muteHttpExceptions': true
  };

  var response = UrlFetchApp.fetch(url, options);
  return {
    success: response.getResponseCode() === 200,
    message: 'Submission deleted'
  };
}

/**
 * TEST FUNCTION: For manual testing only
 * This creates a dummy event object for testing onFormSubmit
 * DO NOT use in production - only for development/testing
 */
function testOnFormSubmit() {
  Logger.log('=== TEST MODE: Running testOnFormSubmit ===');
  Logger.log('This is a test function. Do not use in production.');

  // Create a dummy event object for testing
  var dummyEvent = {
    response: {
      getId: function() { return 'test-response-id'; },
      getItemResponses: function() {
        // Return dummy item responses with exact question titles from FIELD_DEFINITIONS
        return [
          {
            getItem: function() { return { getTitle: function() { return 'あなたの名前をプルダウンから選択して下さい。 ※ここをミスるとデータが破壊されるので絶対間違えないで下さい！'; } }; },
            getResponse: function() { return '001_夜叉姫'; }
          },
          {
            getItem: function() { return { getTitle: function() { return '名前（ひらがな）'; } }; },
            getResponse: function() { return 'やしゃひめ'; }
          },
          {
            getItem: function() { return { getTitle: function() { return '名前（ローマ字）'; } }; },
            getResponse: function() { return 'Yashahime'; }
          },
          {
            getItem: function() { return { getTitle: function() { return 'Web ページへの公開可否フラグ 外部に公開せず内容だけ予め他投稿したい場合は「非公開」、公開しても問題ない場合は「公開」を選択。 ※自己紹介ページの内容は Google フォームの編集用 URL から修正できます。予め内容を入力しておいてデビュー時に公開フラグだけ更新してもよいです。'; } }; },
            getResponse: function() { return '公開'; }
          }
        ];
      }
    }
  };

  try {
    // Call onFormSubmit with dummy event
    var result = onFormSubmit(dummyEvent);
    Logger.log('=== TEST RESULT: Success ===');
    Logger.log('Result: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('=== TEST RESULT: Error ===');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + (error.stack || 'No stack trace available'));
  }
}
