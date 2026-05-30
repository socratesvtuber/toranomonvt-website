// ============================================
// Field Mapping - Questions mapped by indexOf matching
// The key is the field name, the value is the question text to match
// Based on Google Form header: Timestamp, Email Address, and form fields
// ============================================
var FIELD_DEFINITIONS = {
   // Core identification fields (using short unique keys for matching)
   'name_select': 'あなたの名前をプルダウンから選択して下さい。',
   'sns_link': 'SNSリンク',
   'name_hiragana': '名前（ひらがな）',
   'name_romaji': '名前（ローマ字）',
   'birthday': '誕生日',
   'first_stream_date': '初配信日',
   'height': '身長',
   'image_color': 'イメージカラー',
   'oshi_mark': '推しマーク',
   'streaming_terms': '配信用語',
   'unit_project_name': 'ユニット・プロジェクト名',
   'illustrator': 'イラストレーター',
   'modeler_2d': '2D モデラー',
   'modeler_3d': '3D モデラー',
   'fan_name': 'ファンネーム',
   'official_hashtag': '公式ハッシュタグ',
   'streaming_schedule': '配信予定',
   'recommended_video': 'オススメ動画',
   'announcement_event': 'お知らせ・イベント予定',
   'goods_music_link': 'グッズ・音楽配信サイトリンク',
   'message_to_fans': 'ファンへ一言',
   'qa': 'Q＆A',
   
   // File upload fields - Updated to match actual form field titles
   'header_image': 'Webに公開するヘッダー画像をアップして下さい。\n（1ファイル10MBまで）',
   'fullbody_image': 'Webに公開する全身画像をアップして下さい。\n（1ファイル10MBまで）',
   'voice_audio': '自己紹介ページで再生されるボイスをアップして下さい。',
   'video': '自己紹介ページに動画を流したい場合はアップして下さい。',
   'outer_image': '自己紹介ページで表示する衣装画像をアップして下さい。\n（1ファイル10MBまで）',
   'three_view_image': '自己紹介ページで表示する三面図画像をアップして下さい。\n（1ファイル10MBまで）',
   'concept_image': '自己紹介ページで表示するコンセプト画像をアップして下さい。\n（1ファイル10MBまで）',
   
   // Public flag field - use longer unique text to avoid false matches
   'public_flag': '公開可否フラグ'
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

// File upload fields - matches the short question text in FIELD_DEFINITIONS
var FILE_UPLOAD_FIELDS = {
   'header_image': 'Webに公開するヘッダー画像をアップして下さい。\n（1 ファイル 10MB まで）',
   'fullbody_image': 'Webに公開する全身画像をアップして下さい。\n（1 ファイル 10MB まで）',
   'voice_audio': '自己紹介ページで再生されるボイスをアップして下さい。',
   'video': '自己紹介ページに動画を流したい場合はアップして下さい。',
   'outer_image': '自己紹介ページで表示する衣装画像をアップして下さい。\n（1 ファイル 10MB まで）',
   'three_view_image': '自己紹介ページで表示する三面図画像をアップして下さい。\n（1 ファイル 10MB まで）',
   'concept_image': '自己紹介ページで表示するコンセプト画像をアップして下さい。\n（1 ファイル 10MB まで）'
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
          handleFileUpload(result, matchedField, response, title);
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

    // Store in Firebase (with duplicate check by name_select)
    Logger.log('========================================');
    Logger.log('=== Storing in Firebase ===');
    Logger.log('=== Checking for existing member by name_select ===');
    var firebaseResult = storeInFirebaseWithDuplicateCheck(result);
    
    Logger.log('========================================');
    Logger.log('=== Form Submission Completed Successfully ===');
    Logger.log('Firebase ID: ' + firebaseResult.id);
    Logger.log('Firebase URL: ' + FIREBASE_DB_URL + '/form_submissions/' + firebaseResult.id);
    Logger.log('========================================');
    
    return {
      success: true,
      firebaseId: firebaseResult.id,
      message: firebaseResult.isUpdate ? 'Data updated successfully in Firebase' : 'Data stored successfully in Firebase'
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
   result.outerImageUrls = [];
   result.threeViewImageUrl = null;
   result.conceptImageUrl = null;

  return result;
}

/**
 * Normalize string by removing extra spaces and newlines
 * @param {String} str - String to normalize
 * @returns {String} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  // Replace multiple spaces/newlines with single space, then trim
  return String(str).replace(/[\s\n\r]+/g, ' ').trim();
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
  var normalizedTitle = normalizeString(titleStr);
  var bestMatch = null;
  var bestMatchLength = 0;

  // First pass: Look for exact or long matches (4+ chars)
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    var normalizedFieldTitle = normalizeString(fieldTitle);

    // Skip very short field titles (less than 4 chars) in first pass to avoid false matches
    if (fieldTitle.length < 4) {
      continue;
    }

    // Check if normalized form title contains the normalized field title
    if (normalizedTitle.indexOf(normalizedFieldTitle) !== -1) {
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
    var normalizedFieldTitle = normalizeString(fieldTitle);

    // Only check short field titles
    if (fieldTitle.length >= 4) {
      continue;
    }

    // Check if normalized form title contains the normalized field title
    if (normalizedTitle.indexOf(normalizedFieldTitle) !== -1) {
      return fieldKey;
    }
  }

  // Third pass: Check if field title contains the form title (for truncated titles)
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    var normalizedFieldTitle = normalizeString(fieldTitle);

    if (normalizedFieldTitle.indexOf(normalizedTitle) !== -1) {
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
 * @param {String} response - File upload response (file ID or comma-separated IDs)
 * @param {String} title - Field title for logging
 */
function handleFileUpload(result, fieldKey, response, title) {
  try {
    Logger.log('=== File Upload Processing ===');
    Logger.log(' Field: ' + fieldKey);
    Logger.log(' Title: ' + title);
    Logger.log(' Response type: ' + typeof response);
    Logger.log(' Response value: ' + (response ? (response.length > 200 ? response.substring(0, 200) + '...' : response) : 'null'));

    if (!response || response.length === 0) {
      Logger.log(' Warning: No response or empty response for field: ' + fieldKey);
      return;
    }

     if (fieldKey === 'voice_audio') {
       // Handle multiple audio files (0-10 files)
       result.voiceAudioUrls = [];
       
       // response is a comma-separated string of file IDs for multiple files
       var fileIds = [];
       if (typeof response === 'string') {
         fileIds = response.split(',');
       } else if (response instanceof Array) {
         fileIds = response;
       }
       
       for (var j = 0; j < fileIds.length; j++) {
         var fileId = null;
         var shareUrl = null;
         var rawId = fileIds[j];
 
         // Get file ID from response - trim whitespace
         if (rawId && typeof rawId === 'object' && typeof rawId.getId === 'function') {
           fileId = rawId.getId();
         } else if (rawId && typeof rawId === 'string') {
           fileId = rawId.trim();
           Logger.log(' String file ID detected: ' + fileId);
         } else {
           Logger.log(' Warning: rawId is not a valid file object: ' + JSON.stringify(rawId));
           continue;
         }
 
         // Construct Google Drive share URL directly from file ID
         shareUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
         Logger.log(' Constructed share URL: ' + shareUrl);
         result.voiceAudioUrls.push(shareUrl);
       }
       Logger.log(' Processed ' + result.voiceAudioUrls.length + ' voice audio files');
     } else if (fieldKey === 'outer_image') {
       // Handle multiple image files (0-10 files)
       result.outerImageUrls = [];
       
       // response is a comma-separated string of file IDs for multiple files
       var fileIds = [];
       if (typeof response === 'string') {
         fileIds = response.split(',');
       } else if (response instanceof Array) {
         fileIds = response;
       }
       
       for (var j = 0; j < fileIds.length; j++) {
         var fileId = null;
         var shareUrl = null;
         var rawId = fileIds[j];
 
         // Get file ID from response - trim whitespace
         if (rawId && typeof rawId === 'object' && typeof rawId.getId === 'function') {
           fileId = rawId.getId();
         } else if (rawId && typeof rawId === 'string') {
           fileId = rawId.trim();
           Logger.log(' String file ID detected: ' + fileId);
         } else {
           Logger.log(' Warning: rawId is not a valid file object: ' + JSON.stringify(rawId));
           continue;
         }
 
         // Construct Google Drive share URL directly from file ID
         shareUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
         Logger.log(' Constructed share URL: ' + shareUrl);
         result.outerImageUrls.push(shareUrl);
       }
       Logger.log(' Processed ' + result.outerImageUrls.length + ' outer image files');
     } else {
       // Handle single file uploads (header_image, fullbody_image, video, three_view_image, concept_image)
       var fileId = null;
       var shareUrl = null;
       var rawResponse = null;
 
       // response could be a string (comma-separated IDs) or array
       if (typeof response === 'string') {
         // Split by comma and take first item
         var parts = response.split(',');
         rawResponse = parts[0] ? parts[0].trim() : null;
       } else if (response instanceof Array) {
         rawResponse = response[0];
       }
 
       // Get file ID from response
       if (rawResponse && typeof rawResponse === 'object' && typeof rawResponse.getId === 'function') {
         fileId = rawResponse.getId();
       } else if (rawResponse && typeof rawResponse === 'string') {
         fileId = rawResponse.trim();
         Logger.log(' String file ID detected: ' + fileId);
       } else {
         Logger.log(' Warning: rawResponse is not a valid file object: ' + JSON.stringify(rawResponse));
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
         } else if (fieldKey === 'three_view_image') {
           result.threeViewImageUrl = shareUrl;
         } else if (fieldKey === 'concept_image') {
           result.conceptImageUrl = shareUrl;
         }
       } else {
         Logger.log(' ERROR: No file ID extracted for field: ' + fieldKey);
       }
     }
  } catch (error) {
    Logger.log('ERROR handling file upload for ' + fieldKey + ': ' + error.toString());
    Logger.log('Stack: ' + (error.stack || 'No stack trace'));
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
 * Store data in Firebase Realtime Database with duplicate check by name_select
 * If a member with the same name_select exists, update the existing record.
 * Otherwise, create a new record.
 * @param {Object} data - Data to store
 * @returns {Object} Result with ID and isUpdate flag
 */
function storeInFirebaseWithDuplicateCheck(data) {
  Logger.log('=== Checking for duplicate by name_select ===');
  
  // Get existing submissions
  var existingData = getExistingSubmissions();
  var existingKey = findExistingNameSelect(existingData, data.name_select);
  
  if (existingKey) {
    // Update existing record
    Logger.log('Existing member found: ' + existingKey + ' - Updating...');
    return updateExistingSubmission(existingKey, data);
  } else {
    // Create new record
    Logger.log('No existing member found - Creating new record...');
    return createNewSubmission(data);
  }
}

/**
 * Get existing submissions from Firebase
 * @returns {Object} Existing submissions data
 */
function getExistingSubmissions() {
  var url = FIREBASE_DB_URL + '/form_submissions.json';
  
  var options = {
    'method': 'get',
    'muteHttpExceptions': true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    
    if (responseCode >= 400) {
      Logger.log('ERROR: Failed to get existing submissions: ' + responseCode);
      return {};
    }
    
    var responseData = response.getContentText();
    if (responseData === 'null') {
      return {};
    }
    
    return JSON.parse(responseData);
  } catch (error) {
    Logger.log('ERROR: Failed to get existing submissions: ' + error.toString());
    return {};
  }
}

/**
 * Find existing submission by name_select
 * @param {Object} submissions - Existing submissions data
 * @param {String} nameSelect - name_select value to find
 * @returns {String|null} Existing key or null
 */
function findExistingNameSelect(submissions, nameSelect) {
  if (!submissions || !nameSelect) return null;
  
  for (var key in submissions) {
    var submission = submissions[key];
    if (submission && submission.name_select === nameSelect) {
      return key;
    }
  }
  
  return null;
}

/**
 * Update existing submission in Firebase
 * @param {String} key - Existing submission key
 * @param {Object} data - New data to update
 * @returns {Object} Result with ID and isUpdate flag
 */
function updateExistingSubmission(key, data) {
  var url = FIREBASE_DB_URL + '/form_submissions/' + key + '.json';
  
  var options = {
    'method': 'put',
    'contentType': 'application/json',
    'payload': JSON.stringify(data),
    'muteHttpExceptions': true
  };
  
  Logger.log('Updating existing submission: ' + key);
  
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  
  if (responseCode >= 400) {
    Logger.log('ERROR: Firebase update error: ' + responseCode);
    throw new Error('Firebase update error: ' + responseCode);
  }
  
  Logger.log('Successfully updated submission: ' + key);
  
  return {
    id: key,
    data: data,
    isUpdate: true
  };
}

/**
 * Create new submission in Firebase
 * @param {Object} data - Data to store
 * @returns {Object} Result with ID
 */
function createNewSubmission(data) {
  return storeInFirebase(data);
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

/**
 * Migration function: Convert sushi_mark field to oshi_mark
 * Run this function ONCE to migrate existing data, then delete or comment out
 * @returns {Object} Migration result
 */
function migrateSushiMarkToOshiMark() {
  Logger.log('=== Starting sushi_mark to oshi_mark migration ===');
  
  var baseUrl = FIREBASE_DB_URL + '/form_submissions.json';
  var options = {
    'method': 'get',
    'muteHttpExceptions': true
  };
  
  // Get all submissions
  var response = UrlFetchApp.fetch(baseUrl, options);
  var submissions = JSON.parse(response.getContentText());
  
  if (!submissions) {
    Logger.log('No submissions found');
    return { success: false, message: 'No submissions found' };
  }
  
  var updatedCount = 0;
  var errorCount = 0;
  
  // Iterate through all submissions
  for (var key in submissions) {
    var data = submissions[key];
    
    // Check if sushi_mark exists and oshi_mark doesn't exist yet
    if (data.sushi_mark && !data.oshi_mark) {
      Logger.log('Migrating ' + key + ': sushi_mark=' + data.sushi_mark);
      
      // Copy sushi_mark value to oshi_mark
      data.oshi_mark = data.sushi_mark;
      
      // Update the submission
      var updateUrl = FIREBASE_DB_URL + '/form_submissions/' + key + '.json';
      var updateOptions = {
        'method': 'put',
        'contentType': 'application/json',
        'payload': JSON.stringify(data),
        'muteHttpExceptions': true
      };
      
      var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
      if (updateResponse.getResponseCode() === 200) {
        updatedCount++;
        Logger.log('Successfully migrated ' + key);
      } else {
        errorCount++;
        Logger.log('Failed to migrate ' + key + ': ' + updateResponse.getContentText());
      }
    }
  }
  
  Logger.log('=== Migration complete ===');
  Logger.log('Updated: ' + updatedCount);
  Logger.log('Errors: ' + errorCount);
  
  return {
  success: true,
  updatedCount: updatedCount,
  errorCount: errorCount,
  message: 'Migrated ' + updatedCount + ' records'
  };
  }
  
  /**
   * Cleanup function: Remove old sushi_mark field from all records
   * Run this AFTER migrateSushiMarkToOshiMark() completes successfully
   * @returns {Object} Cleanup result
   */
  function cleanupSushiMarkField() {
  Logger.log('=== Starting sushi_mark field cleanup ===');
  
  var baseUrl = FIREBASE_DB_URL + '/form_submissions.json';
  var options = {
  'method': 'get',
  'muteHttpExceptions': true
  };
  
  // Get all submissions
  var response = UrlFetchApp.fetch(baseUrl, options);
  var submissions = JSON.parse(response.getContentText());
  
  if (!submissions) {
  Logger.log('No submissions found');
  return { success: false, message: 'No submissions found' };
  }
  
  var cleanedCount = 0;
  var errorCount = 0;
  
  // Iterate through all submissions
  for (var key in submissions) {
  var data = submissions[key];
  
  // Check if sushi_mark field exists
  if (data.sushi_mark) {
  Logger.log('Cleaning up ' + key + ': removing sushi_mark field');
  
  // Delete the sushi_mark field
  delete data.sushi_mark;
  
  // Update the submission
  var updateUrl = FIREBASE_DB_URL + '/form_submissions/' + key + '.json';
  var updateOptions = {
  'method': 'put',
  'contentType': 'application/json',
  'payload': JSON.stringify(data),
  'muteHttpExceptions': true
  };
  
  var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
  if (updateResponse.getResponseCode() === 200) {
  cleanedCount++;
  Logger.log('Successfully cleaned ' + key);
  } else {
  errorCount++;
  Logger.log('Failed to clean ' + key + ': ' + updateResponse.getContentText());
  }
  }
  }
  
  Logger.log('=== Cleanup complete ===');
  Logger.log('Cleaned: ' + cleanedCount);
  Logger.log('Errors: ' + errorCount);
  
  return {
  success: true,
  cleanedCount: cleanedCount,
  errorCount: errorCount,
  message: 'Cleaned ' + cleanedCount + ' records'
  };
  }
  
  /**
   * Migration function: Convert streaming_language field to streaming_terms
   * Run this function ONCE to migrate existing data, then delete or comment out
   * @returns {Object} Migration result
   */
  function migrateStreamingLanguageToTerms() {
  Logger.log('=== Starting streaming_language to streaming_terms migration ===');
  
  var baseUrl = FIREBASE_DB_URL + '/form_submissions.json';
  var options = {
  'method': 'get',
  'muteHttpExceptions': true
  };
  
  // Get all submissions
  var response = UrlFetchApp.fetch(baseUrl, options);
  var submissions = JSON.parse(response.getContentText());
  
  if (!submissions) {
  Logger.log('No submissions found');
  return { success: false, message: 'No submissions found' };
  }
  
  var updatedCount = 0;
  var errorCount = 0;
  
  // Iterate through all submissions
  for (var key in submissions) {
  var data = submissions[key];
  
  // Check if streaming_language exists and streaming_terms doesn't exist yet
  if (data.streaming_language && !data.streaming_terms) {
  Logger.log('Migrating ' + key + ': streaming_language=' + data.streaming_language);
  
  // Copy streaming_language value to streaming_terms
  data.streaming_terms = data.streaming_language;
  
  // Update the submission
  var updateUrl = FIREBASE_DB_URL + '/form_submissions/' + key + '.json';
  var updateOptions = {
  'method': 'put',
  'contentType': 'application/json',
  'payload': JSON.stringify(data),
  'muteHttpExceptions': true
  };
  
  var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
  if (updateResponse.getResponseCode() === 200) {
  updatedCount++;
  Logger.log('Successfully migrated ' + key);
  } else {
  errorCount++;
  Logger.log('Failed to migrate ' + key + ': ' + updateResponse.getContentText());
  }
  }
  }
  
  Logger.log('=== Migration complete ===');
  Logger.log('Updated: ' + updatedCount);
  Logger.log('Errors: ' + errorCount);
  
  return {
  success: true,
  updatedCount: updatedCount,
  errorCount: errorCount,
  message: 'Migrated ' + updatedCount + ' records'
  };
  }
  
  /**
   * Cleanup function: Remove old streaming_language field from all records
   * Run this AFTER migrateStreamingLanguageToTerms() completes successfully
   * @returns {Object} Cleanup result
   */
  function cleanupStreamingLanguageField() {
  Logger.log('=== Starting streaming_language field cleanup ===');
  
  var baseUrl = FIREBASE_DB_URL + '/form_submissions.json';
  var options = {
  'method': 'get',
  'muteHttpExceptions': true
  };
  
  // Get all submissions
  var response = UrlFetchApp.fetch(baseUrl, options);
  var submissions = JSON.parse(response.getContentText());
  
  if (!submissions) {
  Logger.log('No submissions found');
  return { success: false, message: 'No submissions found' };
  }
  
  var cleanedCount = 0;
  var errorCount = 0;
  
  // Iterate through all submissions
  for (var key in submissions) {
  var data = submissions[key];
  
  // Check if streaming_language field exists
  if (data.streaming_language) {
  Logger.log('Cleaning up ' + key + ': removing streaming_language field');
  
  // Delete the streaming_language field
  delete data.streaming_language;
  
  // Update the submission
  var updateUrl = FIREBASE_DB_URL + '/form_submissions/' + key + '.json';
  var updateOptions = {
  'method': 'put',
  'contentType': 'application/json',
  'payload': JSON.stringify(data),
  'muteHttpExceptions': true
  };
  
  var updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
  if (updateResponse.getResponseCode() === 200) {
  cleanedCount++;
  Logger.log('Successfully cleaned ' + key);
  } else {
  errorCount++;
  Logger.log('Failed to clean ' + key + ': ' + updateResponse.getContentText());
  }
  }
  }
  
  Logger.log('=== Cleanup complete ===');
  Logger.log('Cleaned: ' + cleanedCount);
  Logger.log('Errors: ' + errorCount);
  
  return {
  success: true,
  cleanedCount: cleanedCount,
  errorCount: errorCount,
  message: 'Cleaned ' + cleanedCount + ' records'
  };
  }
