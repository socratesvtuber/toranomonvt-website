# Google Form to Firebase Integration

This module provides Google Apps Script (GAS) code to handle Google Form submissions and store the data in Firebase Realtime Database.

## Files

| File | Description |
|------|-------------|
| `code.gs` | Main script with form submission handler |
| `config.gs.example` | Configuration template (copy to config.gs) |
| `README.md` | This documentation file |

## Setup Instructions

### Step 1: Prepare Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Realtime Database**:
   - Go to Build > Realtime Database
   - Click "Create Database"
   - Choose your region
   - Set up security rules (start in test mode for development)

4. Get your Database URL:
   - Go to Realtime Database > Settings (gear icon)
   - Copy the URL (format: `https://your-project-id.firebaseio.com`)

### Step 2: Prepare Google Drive

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for file uploads
3. Get the folder ID from the URL:
   - URL format: `https://drive.google.com/drive/folders/1ABC123...xyz`
   - Folder ID: `1ABC123...xyz`

> **Note:** `GOOGLE_DRIVE_FOLDER_ID` is currently unused in the codebase. File uploads are saved to the form owner's Drive automatically, and share URLs are generated directly from file IDs. The folder ID variable is kept for potential future use.

### Step 3: Set up Google Apps Script

1. Open your Google Form
2. Click on the three dots (⋮) > "Script editor"
3. In the Script Editor:
   - Delete any existing code in `Code.gs`
   - Copy the contents of `code.gs` from this repository
   - Copy the contents of `config.gs.example` to a new file named `config.gs`
   - Fill in your Firebase and Google Drive credentials in `config.gs`

### Step 4: Configure Form Trigger

1. In the Script Editor, click on "Triggers" (clock icon) in the left sidebar
2. Click "+ Add Trigger"
3. Configure the trigger:
   - **Function**: `onFormSubmit`
   - **Event**: `On form submit`
   - **Source**: Select your form
4. Click "Save"
5. Grant necessary permissions when prompted

### Step 5: Set up Form Questions

Make sure your Google Form has the following questions (exact wording matters for indexOf matching):

#### Required Fields:
- あなたの名前をプルダウンから選択して下さい。
- 名前（ひらがな）
- 名前（ローマ字）
- Web に公開するヘッダー画像をアップして下さい。
- Web に公開する全身画像をアップして下さい。
- Web ページへの公開可否フラグ

#### Optional Fields:
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
- 自己紹介ページで再生されるボイスをアップして下さい。（0-10 ファイル）
- 自己紹介ページに動画を流したい場合はアップして下さい。

### Step 6: Test the Integration

1. Submit a test response from your Google Form
2. Go to Firebase Console > Realtime Database
3. Verify that data appears under `/form_submissions/`
4. Check the Logs in Script Editor for any errors

## Data Structure

The data stored in Firebase will have the following structure:

```json
{
  "name_select": "Selected name or null",
  "sns_link": "SNS link or null",
  "name_hiragana": "Name in hiragana",
  "name_romaji": "Name in romaji",
  "birthday": "Birthday or null",
  "first_stream_date": "First stream date or null",
  "height": "Height or null",
  "image_color": "Image color or null",
  "oshi_mark": "Oshi mark or null",
  "streaming_terms": "Streaming terms or null",
  "unit_project_name": "Unit/Project name or null",
  "illustrator": "Illustrator or null",
  "2d_modeler": "2D modeler or null",
  "3d_modeler": "3D modeler or null",
  "fan_name": "Fan name or null",
  "official_hashtag": "Official hashtag or null",
  "streaming_schedule": "Streaming schedule or null",
  "recommended_video": "Recommended video URL or null",
  "announcement_event": "Announcement/Event info or null",
  "goods_music_link": "Goods/Music link or null",
  "message_to_fans": "Message to fans or null",
  "qa": "Q&A or null",
  "headerImageUrl": "Google Drive share URL for header image",
  "fullbodyImageUrl": "Google Drive share URL for full body image",
  "voiceAudioUrls": ["array", "of", "voice", "file", "URLs"],
  "videoUrl": "Google Drive share URL for video",
  "submittedAt": "2024-01-01T00:00:00.000Z",
  "formSubmissionId": "form-submission-id",
  "timestamp": 1704067200000
}
```

## Security Notes

1. **Never commit `config.gs`** with real credentials to version control
2. Add `config.gs` to your `.gitignore` file
3. Use Firebase Security Rules to control access to your database
4. Consider using Firebase Admin SDK for production environments

## Troubleshooting

### Form submission not triggering
- Check if the trigger is properly set up in Script Editor
- Verify the function name matches exactly (`onFormSubmit`)
- Check the execution logs in Script Editor

### Data not appearing in Firebase
- Verify your Firebase Database URL is correct
- Check Firebase security rules allow writes
- Look for error logs in Script Editor

### File upload issues
- Ensure the Google Drive folder is shared appropriately
- Verify the folder ID is correct
- Check file size limits (Google Drive: 15GB per file)

## API Reference

### `onFormSubmit(e)`
Main function triggered when form is submitted.

### `parseFormData(formData, itemResponses)`
Parses form data using indexOf for field identification.

### `processFileUploads(e)`
Processes file uploads and returns Google Drive share URLs.

### `storeInFirebase(data)`
Stores parsed data in Firebase Realtime Database.

### `testFirebaseConnection()`
Test function to verify Firebase connection.
