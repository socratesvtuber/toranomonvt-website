// ============================================
// Field Mapping - Questions mapped by indexOf matching
// Top/News content form fields
// ============================================
var FIELD_DEFINITIONS = {
   'logo_image_1': 'ロゴ画像アップロード１',
   'logo_image_2': 'ロゴ画像アップロード２',
   'logo_image_3': 'ロゴ画像アップロード３',
   'logo_image_4': 'ロゴ画像アップロード４',
   'logo_image_5': 'ロゴ画像アップロード５',
   'header_image_1': 'ヘッダ画像アップロード１',
   'header_image_2': 'ヘッダ画像アップロード２',
   'header_image_3': 'ヘッダ画像アップロード３',
   'header_image_4': 'ヘッダ画像アップロード４',
   'header_image_5': 'ヘッダ画像アップロード５',
   'normal_image_1': '通常画像アップロード１',
   'normal_image_2': '通常画像アップロード２',
   'normal_image_3': '通常画像アップロード３',
   'normal_image_4': '通常画像アップロード４',
   'normal_image_5': '通常画像アップロード５',
   'news1_genre': 'ニュース１ジャンル',
   'news1_headline': 'ニュース１見出し',
   'news1_content': 'ニュース１_内容',
   'news1_url': 'ニュース１URL',
   'news2_genre': 'ニュース２ジャンル',
   'news2_headline': 'ニュース２見出し',
   'news2_content': 'ニュース２内容',
   'news2_url': 'ニュース２URL',
   'news3_genre': 'ニュース３ジャンル',
   'news3_headline': 'ニュース３見出し',
   'news3_content': 'ニュース３内容',
   'news3_url': 'ニュース３URL',
   'past_event1_date': '過去のイベント、実績１日付',
   'past_event1_headline': '過去のイベント、実績１見出し',
   'past_event1_content': '過去のイベント、実績１内容',
   'past_event1_url': '過去のイベント、実績１URL',
   'past_event2_date': '過去のイベント、実績２日付',
   'past_event2_headline': '過去のイベント、実績２見出し',
   'past_event2_content': '過去のイベント、実績２内容',
   'past_event2_url': '過去のイベント、実績２URL',
   'past_event3_date': '過去のイベント、実績３日付',
   'past_event3_headline': '過去のイベント、実績３見出し',
   'past_event3_content': '過去のイベント、実績３内容',
   'past_event3_url': '過去のイベント、実績３_URL',
   'email': 'メール',
   'x_twitter': 'X（旧ツイッター）',
   'tiktok': 'TikTok',
   'youtube': 'YouTube',
   'twitch': 'Twitch',
   'discord_invite': 'Discord招待リンク'
};

var FILE_UPLOAD_FIELDS = {
   'logo_image_1': 'ロゴ画像アップロード１',
   'logo_image_2': 'ロゴ画像アップロード２',
   'logo_image_3': 'ロゴ画像アップロード３',
   'logo_image_4': 'ロゴ画像アップロード４',
   'logo_image_5': 'ロゴ画像アップロード５',
   'header_image_1': 'ヘッダ画像アップロード１',
   'header_image_2': 'ヘッダ画像アップロード２',
   'header_image_3': 'ヘッダ画像アップロード３',
   'header_image_4': 'ヘッダ画像アップロード４',
   'header_image_5': 'ヘッダ画像アップロード５',
   'normal_image_1': '通常画像アップロード１',
   'normal_image_2': '通常画像アップロード２',
   'normal_image_3': '通常画像アップロード３',
   'normal_image_4': '通常画像アップロード４',
   'normal_image_5': '通常画像アップロード５'
};

/**
 * Main function: Called when Google Form is submitted
 * @param {Object} e - Form submission event object
 */
function onFormSubmit(e) {
   var lock = LockService.getScriptLock();

   try {
     lock.waitLock(30000);

     Logger.log('========================================');
     Logger.log('=== Top Form Submission Started ===');
     Logger.log('Timestamp: ' + new Date().toISOString());
     Logger.log('========================================');

     if (!e) {
       Logger.log('ERROR: Invalid event object');
       throw new Error('Invalid event object');
     }

     var formResponse = e.response;
     if (!formResponse) {
       Logger.log('WARNING: e.response missing, constructing mock response from namedValues');
       var namedValues = e.namedValues || {};
       var mockItemResponses = [];
       for (var key in namedValues) {
         if (namedValues.hasOwnProperty(key)) {
           (function(k) {
             mockItemResponses.push({
               getItem: function() { return { getTitle: function() { return k; }, getType: function() { return 'TEXT'; } }; },
               getResponse: function() { return namedValues[k][0]; }
             });
           })(key);
         }
       }
       formResponse = {
         getItemResponses: function() { return mockItemResponses; },
         getId: function() { return 'mock-response-id'; },
         getRespondentEmail: function() { return ''; }
       };
     }

     var itemResponses = formResponse.getItemResponses();
     Logger.log('Form Response ID: ' + formResponse.getId());
     Logger.log('Number of item responses: ' + itemResponses.length);

     var result = initializeResultObject();

     for (var i = 0; i < itemResponses.length; i++) {
       var itemResponse = itemResponses[i];
       var item = itemResponse.getItem();
       var title = item.getTitle();
       var responseType = typeof item.getType === 'function' ? item.getType() : 'TEXT';
       var response = itemResponse.getResponse();

       Logger.log('--- Processing Item ' + (i + 1) + ' ---');
       Logger.log(' Title: ' + title);
       Logger.log(' Response Type: ' + responseType);
       Logger.log(' Response: ' + (response ? (response.length > 100 ? response.substring(0, 100) + '...' : response) : 'null'));

       var matchedField = findMatchingField(title);

       if (matchedField) {
         Logger.log(' Matched Field: ' + matchedField);

         if (isFileUploadField(matchedField)) {
           Logger.log(' Handling as file upload field');
           handleFileUpload(result, matchedField, response, title);
         } else {
           result[matchedField] = formatResponse(response, responseType);
           Logger.log(' Set value: ' + result[matchedField]);
         }
       } else {
         Logger.log(' WARNING: No matching field found for this title');
       }
     }

     Logger.log('========================================');
     Logger.log('=== Parsed Data Summary ===');

     result.submittedAt = new Date().toISOString();
     result.formSubmissionId = formResponse.getId();
     result.formResponseId = formResponse.getRespondentEmail() || 'anonymous';
     result.timestamp = Date.now();

     Logger.log('=== Storing in Firebase ===');
     var firebaseResult = storeInFirebase(result);

     Logger.log('=== Form Submission Completed Successfully ===');
     Logger.log('Firebase ID: ' + firebaseResult.id);

     return {
       success: true,
       firebaseId: firebaseResult.id,
       message: 'Top content stored successfully in Firebase'
     };

   } catch (error) {
     Logger.log('========================================');
     Logger.log('=== ERROR OCCURRED ===');
     Logger.log('Error: ' + error.toString());
     Logger.log('Stack: ' + (error.stack || 'No stack trace available'));

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

   for (var key in FIELD_DEFINITIONS) {
     result[key] = null;
   }

   result.logoImageUrls = {};
   result.headerImageUrls = {};
   result.normalImageUrls = {};
   result.news = [];
   result.pastEvents = [];
   result.socialLinks = {};

   return result;
}

/**
 * Normalize string by removing extra spaces and newlines
 * @param {String} str - String to normalize
 * @returns {String} Normalized string
 */
function normalizeString(str) {
   if (!str) return '';
   return String(str).replace(/[\s\n\r]+/g, ' ').trim();
}

/**
 * Find matching field key using indexOf
 * @param {String} title - Field title from form
 * @returns {String|null} Matching field key or null
 */
function findMatchingField(title) {
   if (!title) return null;

   var titleStr = String(title).trim();
   var normalizedTitle = normalizeString(titleStr);

   for (var fieldKey in FIELD_DEFINITIONS) {
     var fieldTitle = FIELD_DEFINITIONS[fieldKey];
     var normalizedFieldTitle = normalizeString(fieldTitle);

     if (normalizedTitle.indexOf(normalizedFieldTitle) !== -1) {
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
 * @param {String} responseType - Response type
 * @returns {String|null} Formatted response
 */
function formatResponse(response, responseType) {
   if (response === null || response === undefined || response === '') {
     return null;
   }

   if (responseType === 'DATE' && response instanceof Date) {
     return Utilities.formatDate(response, Session.getScriptTimeZone(), 'yyyy-MM-dd');
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
 * @param {*} response - File upload response
 * @param {String} title - Field title for logging
 */
function handleFileUpload(result, fieldKey, response, title) {
   try {
     Logger.log('=== File Upload Processing ===');
     Logger.log(' Field: ' + fieldKey);
     Logger.log(' Title: ' + title);

     if (!response || response.length === 0) {
       Logger.log(' Warning: No response or empty response for field: ' + fieldKey);
       return;
     }

     var fileId = null;
     var shareUrl = null;

     if (typeof response === 'string') {
       var parts = response.split(',');
       var rawResponse = parts[0] ? parts[0].trim() : null;
       if (rawResponse) {
         fileId = rawResponse;
       }
     } else if (response instanceof Array) {
       fileId = response[0];
     } else if (typeof response === 'object' && typeof response.getId === 'function') {
       fileId = response.getId();
     }

     if (fileId) {
       shareUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
       Logger.log(' File ID: ' + fileId);
       Logger.log(' Share URL: ' + shareUrl);

       if (fieldKey.indexOf('logo_image') !== -1) {
         var num = fieldKey.replace('logo_image_', '');
         result.logoImageUrls['logo_' + num] = shareUrl;
       } else if (fieldKey.indexOf('header_image') !== -1) {
         var num = fieldKey.replace('header_image_', '');
         result.headerImageUrls['header_' + num] = shareUrl;
       } else if (fieldKey.indexOf('normal_image') !== -1) {
         var num = fieldKey.replace('normal_image_', '');
         result.normalImageUrls['normal_' + num] = shareUrl;
       }
     } else {
       Logger.log(' ERROR: No file ID extracted for field: ' + fieldKey);
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
   var url = FIREBASE_DB_URL + '/top_submissions.json';

   Logger.log('Firebase URL: ' + url);

   if (!FIREBASE_DB_URL || FIREBASE_DB_URL.indexOf('YOUR_') !== -1 || FIREBASE_DB_URL.indexOf('your-') !== -1) {
     Logger.log('ERROR: Firebase URL is not configured properly!');
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

     var url = FIREBASE_DB_URL + '/top_form_errors.json';

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

   if (!FIREBASE_DB_URL || FIREBASE_DB_URL.indexOf('YOUR_') !== -1 || FIREBASE_DB_URL.indexOf('your-') !== -1) {
     Logger.log('ERROR: Firebase URL is not configured!');
     return {
       success: false,
       message: 'Firebase URL not configured. Please check config.gs file.',
       firebaseUrl: FIREBASE_DB_URL
     };
   }

   var testData = {
     test: true,
     timestamp: new Date().toISOString(),
     message: 'Firebase connection test from Toranomon VT Top Form Handler'
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
   var url = FIREBASE_DB_URL + '/top_submissions.json';

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
   var url = FIREBASE_DB_URL + '/top_submissions/' + id + '.json';

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
   var url = FIREBASE_DB_URL + '/top_submissions/' + id + '.json';

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
 */
function testOnFormSubmit() {
   Logger.log('=== TEST MODE: Running testOnFormSubmit ===');

   var dummyEvent = {
     response: {
       getId: function() { return 'test-top-response-id'; },
       getItemResponses: function() {
         return [
           {
             getItem: function() { return { getTitle: function() { return 'ロゴ画像アップロード１'; }, getType: function() { return 'FILE_UPLOAD'; } }; },
             getResponse: function() { return 'fakeFileIdLogo1'; }
           },
           {
             getItem: function() { return { getTitle: function() { return 'ニュース１ジャンル'; }, getType: function() { return 'TEXT'; } }; },
             getResponse: function() { return 'お知らせ'; }
           },
           {
             getItem: function() { return { getTitle: function() { return 'ニュース１見出し'; }, getType: function() { return 'TEXT'; } }; },
             getResponse: function() { return '新プロジェクト開始'; }
           },
           {
             getItem: function() { return { getTitle: function() { return '過去のイベント、実績１日付'; }, getType: function() { return 'DATE'; } }; },
             getResponse: function() { return new Date('2024-05-20'); }
           },
           {
             getItem: function() { return { getTitle: function() { return 'Discord招待リンク'; }, getType: function() { return 'TEXT'; } }; },
             getResponse: function() { return 'https://discord.gg/toranomonvt'; }
           }
         ];
       }
     }
   };

   try {
     var result = onFormSubmit(dummyEvent);
     Logger.log('=== TEST RESULT: Success ===');
     Logger.log('Result: ' + JSON.stringify(result));
   } catch (error) {
     Logger.log('=== TEST RESULT: Error ===');
     Logger.log('Error: ' + error.toString());
   }
}