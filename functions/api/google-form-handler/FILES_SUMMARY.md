# Google Form × Firebase Integration - File Summary

This document provides an overview of all files created for the Google Form to Firebase integration system.

## 📁 File Structure

```
functions/api/google-form-handler/
├── code.gs                    # Main Google Apps Script (GAS) code
├── config.gs.example          # Configuration template (copy to config.gs)
├── appsscript.json            # GAS project configuration
├── firebase-rules.json        # Firebase Security Rules
├── firebase-rules.txt         # Firebase Security Rules (text version)
├── sample-data.json           # Sample data structure
├── firebase-data-loader.js    # Website JavaScript for fetching data
├── member-styles.css          # CSS styles for member pages
├── .gitignore                 # Git ignore file
├── README.md                  # English documentation
├── SETUP_GUIDE_JA.md          # Japanese setup guide
└── FILES_SUMMARY.md           # This file
```

## 📄 File Descriptions

### Core Files

| File | Purpose | Required |
|------|---------|----------|
| [`code.gs`](code.gs) | Main GAS script with `onFormSubmit` function and indexOf-based field parsing | ✅ Required |
| [`config.gs.example`](config.gs.example) | Template for Firebase/Drive credentials | ✅ Required (copy to config.gs) |
| [`appsscript.json`](appsscript.json) | GAS project configuration with OAuth scopes | ✅ Required |

### Configuration Files

| File | Purpose | Required |
|------|---------|----------|
| [`firebase-rules.json`](firebase-rules.json) | Firebase Security Rules for production | ⚠️ Recommended |
| [`sample-data.json`](sample-data.json) | Sample data structure reference | ℹ️ Reference only |

### Website Integration Files

| File | Purpose | Required |
|------|---------|----------|
| [`firebase-data-loader.js`](firebase-data-loader.js) | JavaScript library for fetching/displaying Firebase data on website | ✅ For website integration |
| [`member-styles.css`](member-styles.css) | CSS styles for member profile pages | ✅ For website integration |

### Documentation Files

| File | Purpose | Language |
|------|---------|----------|
| [`README.md`](README.md) | Setup and usage documentation | English |
| [`SETUP_GUIDE_JA.md`](SETUP_GUIDE_JA.md) | Detailed setup guide | Japanese |
| [`FILES_SUMMARY.md`](FILES_SUMMARY.md) | This file summary | English/Japanese |

### Utility Files

| File | Purpose |
|------|---------|
| [`.gitignore`](.gitignore) | Prevents committing sensitive config files |

## 🔧 Key Features

### 1. indexOf() Based Field Matching

The script uses `indexOf()` for flexible field name matching:

```javascript
// From code.gs
function findMatchingField(title) {
  if (!title) return null;
  
  var titleStr = String(title).trim();
  
  for (var fieldKey in FIELD_DEFINITIONS) {
    var fieldTitle = FIELD_DEFINITIONS[fieldKey];
    
    // Use indexOf for matching (handles partial matches)
    if (titleStr.indexOf(fieldTitle) !== -1 || fieldTitle.indexOf(titleStr) !== -1) {
      return fieldKey;
    }
  }
  
  return null;
}
```

### 2. Field Definitions

All form fields are defined in `FIELD_DEFINITIONS`:

```javascript
var FIELD_DEFINITIONS = {
  // Required fields
  'name_select': 'あなたの名前をプルダウンから選択して下さい。',
  'name_hiragana': '名前（ひらがな）',
  'name_romaji': '名前（ローマ字）',
  'header_image': 'Web に公開するヘッダー画像をアップして下さい。',
  'fullbody_image': 'Web に公開する全身画像をアップして下さい。',
  'public_flag': 'Web ページへの公開可否フラグ',
  
  // Optional fields
  'sns_link': 'SNS リンク',
  'birthday': '誕生日',
  // ... more fields
};
```

### 3. File Upload Handling

- **Header Image**: Single file → Google Drive share URL
- **Full Body Image**: Single file → Google Drive share URL
- **Voice Audio**: Multiple files (0-10) → Array of Google Drive share URLs
- **Video**: Single file → Google Drive share URL

### 4. Data Flow

```
Google Form Submission
        ↓
onFormSubmit(e) triggered
        ↓
Parse form data using indexOf()
        ↓
Process file uploads (Google Drive)
        ↓
Store in Firebase Realtime Database
        ↓
Website fetches data via firebase-data-loader.js
        ↓
Display on member pages
```

## 🚀 Quick Start

1. **Copy configuration file**:
   ```bash
   cp config.gs.example config.gs
   ```

2. **Edit `config.gs`** with your Firebase and Google Drive credentials

3. **Upload to Google Apps Script**:
   - Open Google Form
   - Extensions → Apps Script
   - Copy all `.gs` files

4. **Set up trigger**:
   - Function: `onFormSubmit`
   - Event: On form submit

5. **Test the integration**:
   - Submit a test form response
   - Check Firebase Console for data
   - Check Script Editor logs

## 📊 Data Structure

Data stored in Firebase:

```json
{
  "form_submissions": {
    "-UNIQUE_ID": {
      "name_select": "value",
      "name_hiragana": "value",
      "name_romaji": "value",
      "headerImageUrl": "https://drive.google.com/...",
      "fullbodyImageUrl": "https://drive.google.com/...",
      "voiceAudioUrls": ["url1", "url2"],
      "videoUrl": "https://drive.google.com/...",
      "public_flag": "する",
      "submittedAt": "2024-01-01T00:00:00.000Z",
      "timestamp": 1704067200000
    }
  }
}
```

## 🔐 Security Notes

1. **Never commit `config.gs`** with real credentials
2. **Use Firebase Security Rules** to control data access
3. **Validate data** on both client and server side
4. **Use environment variables** for sensitive data in production

## 📝 Required Form Questions

The following questions must exist in your Google Form (exact wording matters for indexOf matching):

### Required (必須):
- あなたの名前をプルダウンから選択して下さい。
- 名前（ひらがな）
- 名前（ローマ字）
- Web に公開するヘッダー画像をアップして下さい。
- Web に公開する全身画像をアップして下さい。
- Web ページへの公開可否フラグ

### Optional (任意):
- SNS リンク
- 誕生日
- 初配信日
- 身長
- イメージカラー
- 推しマーク
- 配信用語
- ユニット・プロジェクト名
- イラストレーター
- 2D モデラー
- 3D モデラー
- ファンネーム
- 公式ハッシュタグ
- 配信予定
- オススメ動画（投稿済みの動画サイトの URL を記入。）
- お知らせ・イベント予定
- グッズ・音楽配信サイトリンク
- ファンへ一言
- Q＆A
- 自己紹介ページで再生されるボイスをアップして下さい。
- 自己紹介ページに動画を流したい場合はアップして下さい。

## 🔗 Integration with Website

To integrate with your existing website:

1. Include the data loader script:
   ```html
   <script src="functions/api/google-form-handler/firebase-data-loader.js"></script>
   ```

2. Include the CSS styles:
   ```html
   <link rel="stylesheet" href="functions/api/google-form-handler/member-styles.css">
   ```

3. The script auto-initializes and loads member data

## 📚 Documentation

- **English**: See [`README.md`](README.md)
- **Japanese**: See [`SETUP_GUIDE_JA.md`](SETUP_GUIDE_JA.md)
- **Sample Data**: See [`sample-data.json`](sample-data.json)

## 🆘 Support

For issues:
1. Check the [SETUP_GUIDE_JA.md](SETUP_GUIDE_JA.md) troubleshooting section
2. Review Firebase Console logs
3. Check Google Apps Script execution logs
