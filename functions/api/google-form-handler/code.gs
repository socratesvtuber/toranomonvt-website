/**
 * Google Form Submission Handler for Toranomon VT Website
 * Stores form responses in Firebase Realtime Database
 * 
 * This script uses indexOf() for field identification to handle
 * multi-line text responses and partial matches.
 * 
 * Setup Instructions:
 * 1. Copy config.gs.example to config.gs
 * 2. Fill in your Firebase and Google Drive credentials
 * 3. Set up form trigger: onFormSubmit function
 */

// ============================================
// Field Mapping - Questions mapped by indexOf matching
// The key is the field name, the value is the question text to match
// ============================================
var FIELD_DEFINITIONS = {
  // Required fields (必須項目)
  'name_select': 'あなたの名前をプルダウンから選択して下さい。',
  'name_hiragana': '名前（ひらがな）',
  'name_romaji': '名前（ローマ字）',
  'header_image': 'Web に公開するヘッダー画像をアップして下さい。',
  'fullbody_image': 'Web に公開する全身画像をアップして下さい。',
  'public_flag': 'Web ページへの公開可否フラグ',
  
  // Optional fields (任意項目)
  'sns_link': 'SNS リンク',
  'birthday': '誕生日',
  'first_stream_date': '初配信日',
  'height': '身長',
  'image_color': 'イメージカラー',
  'sushi_mark': '推しマーク',
  'streaming_language': '配信用語',
  'unit_project_name': 'ユニット・プロジェクト名',
  'illustrator': 'イラストレーター',
  'modeler_2d': '2D モデラー',
  'modeler_3d': '3D モデラー',
  'fan_name': 'ファンネーム',
  'official_hashtag': '公式ハッシュタグ',
  'streaming_schedule': '配信予定',
  'recommended_video': 'オススメ動画（投稿済みの動画サイトの URL を記入。）',
  'announcement_event': 'お知らせ・イベント予定',
  'goods_music_link': 'グッズ・音楽配信サイトリンク',
  'message_to_fans': 'ファンへ一言',
  'qa': 'Q＆A',
  'voice_audio': '自己紹介ページで再生されるボイスをアップして下さい。',
  'video': '自己紹介ページに動画を流したい場合はアップして下さい。'
};

// Required fields list
var REQUIRED_FIELD_KEYS = [
  'name_hiragana',
  'name_romaji',
  'header_image',
  'fullbody_image',
  'public_flag'
];

// File upload fields
var FILE_UPLOAD_FIELDS = {
  'header_image': 'Web に公開するヘッダー画像をアップして下さい。',
  'fullbody_image': 'Web に公開する全身画像をアップして下さい。',
  'voice_audio': '自己紹介ページで再生されるボイスをアップして下さい。',
  'video': '自己紹介ページに動画を流したい場合はアップして下さい。'
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
    
    Logger.log('=== Form Submission Started ===');
    Logger.log('Timestamp: ' + new Date().toISOString());
    
    // Validate event object
    if (!e || !e.response) {
      throw new Error('Invalid event object');
    }
    
    // Get form response
    var formResponse = e.response;
    var itemResponses = formResponse.getItemResponses();
    
    Logger.log('Number of item responses: ' + itemResponses.length);
    
    // Initialize result object with all fields as null
    var result = initializeResultObject();
    
    // Parse each item response using indexOf matching
    for (var i = 0; i < itemResponses.length; i++) {
      var itemResponse = itemResponses[i];
      var item = itemResponse.getItem();
      var title = item.getTitle();
      var responseType = item.getType();
      var response = itemResponse.getResponse();
      
      Logger.log('Processing item ' + i + ': ' + title);
      Logger.log('Response type: ' + responseType);
      
      // Use indexOf to find matching field
      var matchedField = findMatchingField(title);
      
      if (matchedField) {
        Logger.log('Matched field: ' + matchedField);
        
        // Handle file uploads separately
        if (isFileUploadField(matchedField)) {
          handleFileUpload(result, matchedField, item, formResponse);
        } else {
          // Handle regular text responses
          result[matchedField] = formatResponse(response);
        }
      } else {
        Logger.log('No matching field found for: ' + title);
      }
    }
    
    // Add metadata
    result.submittedAt = new Date().toISOString();
    result.formSubmissionId = formResponse.getId();
    result.formResponseId = formResponse.getRespondentEmail() || 'anonymous';
    result.timestamp = Date.now();
    
    Logger.log('Parsed data: ' + JSON.stringify(result, null, 2));
    
    // Store in Firebase
    var firebaseResult = storeInFirebase(result);
    
    Logger.log('=== Form Submission Completed Successfully ===');
    Logger.log('Firebase ID: ' + firebaseResult.id);
    
    return {
      success: true,
      firebaseId: firebaseResult.id,
      message: 'Data stored successfully in Firebase'
    };
    
  } catch (error) {
    Logger.log('=== ERROR ===');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.getStackTrace());
    
    // Store error in Firebase for debugging
    storeErrorInFirebase(error, e);
    
    return {
      success: false,
      error: error.toString(),
      stack: error.getStackTrace()
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
 * @param {String} title - Field title from form
 * @returns {String|null} Matching field key or null
 */
function findMatchingField(title) {
  if (!title) return null;
  
  var titleStr = String(title).trim();
  
  // Iterate through field definitions
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    
    // Use indexOf for matching (handles partial matches)
    // Check both directions for flexibility
    if (titleStr.indexOf(fieldTitle) !== -1 || fieldTitle.indexOf(titleStr) !== -1) {
      return fieldKey;
    }
  }
  
  // Additional check: character-by-character indexOf matching
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    
    // Check if form title contains the field title
    if (titleStr.indexOf(fieldTitle) !== -1) {
      return fieldKey;
    }
    
    // Check if field title contains the form title (for truncated titles)
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
        
        if (response && response.length > 0) {
          if (fieldKey === 'voice_audio') {
            // Handle multiple audio files (0-10 files)
            result.voiceAudioUrls = [];
            for (var j = 0; j < response.length; j++) {
              var fileId = response[j].getId();
              var file = DriveApp.getFileById(fileId);
              result.voiceAudioUrls.push(file.getShareUrl());
            }
          } else {
            // Handle single file uploads
            var fileId = response[0].getId();
            var file = DriveApp.getFileById(fileId);
            var shareUrl = file.getShareUrl();
            
            if (fieldKey === 'header_image') {
              result.headerImageUrl = shareUrl;
            } else if (fieldKey === 'fullbody_image') {
              result.fullbodyImageUrl = shareUrl;
            } else if (fieldKey === 'video') {
              result.videoUrl = shareUrl;
            }
          }
        }
        break;
      }
    }
  } catch (error) {
    Logger.log('Error handling file upload for ' + fieldKey + ': ' + error.toString());
  }
}

/**
 * Store data in Firebase Realtime Database
 * @param {Object} data - Data to store
 * @returns {Object} Result with ID
 */
function storeInFirebase(data) {
  var url = FIREBASE_DB_URL + '/form_submissions.json';
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(data),
    'muteHttpExceptions': true
  };
  
  Logger.log('Storing data in Firebase: ' + url);
  
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  
  if (responseCode >= 400) {
    throw new Error('Firebase error: ' + responseCode + ' - ' + response.getContentText());
  }
  
  var result = JSON.parse(response.getContentText());
  
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
      errorStack: error.getStackTrace ? error.getStackTrace() : 'No stack trace available',
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
  var testData = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Firebase connection test from Toranomon VT Google Form Handler'
  };
  
  var result = storeInFirebase(testData);
  return {
    success: true,
    message: 'Connection successful',
    firebaseId: result.id
  };
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
