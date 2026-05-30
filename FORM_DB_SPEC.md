# Google フォーム・Firebase データベース仕様書

このドキュメントでは、虎ノ門 VT 公式サイトで使用される Google フォームの質問項目と、Firebase Realtime Database への保存構造について記載しています。

**最終更新日**: 2026-05-30
**バージョン**: 1.4.1

---

## 目次

1. [システム概要](#システム概要)
2. [データフロー](#データフロー)
3. [Google フォーム質問項目一覧](#google-フォーム質問項目一覧)
4. [Firebase データベース構造](#firebase-データベース構造)
5. [フィールド変換マップ](#フィールド変換マップ)
6. [必須項目](#必須項目)
7. [ファイルアップロードフィールド](#ファイルアップロードフィールド)
8. [公開フラグ仕様](#公開フラグ仕様)
9. [変更履歴](#変更履歴)

---

## システム概要

本システムでは、メンバー情報登録用に Google フォームを使用し、送信されたデータを Google Apps Script (GAS) で受信して Firebase Realtime Database に保存しています。

### 使用技術

| 構成要素 | 技術 |
|---------|------|
| フォーム | Google フォーム |
| 処理 | Google Apps Script (GAS) |
| データベース | Firebase Realtime Database |
| 画像保存 | Google Drive |

---

## データフロー

### 全体フロー

```
┌─────────────────┐
│  Google フォーム │
│  (メンバー情報入力)│
└────────┬────────┘
         │
         │ onFormSubmit トリガー
         ▼
┌─────────────────┐
│  Google Apps    │
│  Script (code.gs)│
│  - 質問項目の紐付け│
│  - ファイル処理  │
│  - 必須チェック  │
│  - 重複チェック  │  ← 2026-05-21 追加
└────────┬────────┘
         │
         │ REST API (POST/PUT)
         ▼
┌─────────────────┐
│  Firebase       │
│  Realtime DB    │
│  /form_submissions│
└────────┬────────┘
         │
         │ リアルタイム同期
         ▼
┌─────────────────┐
│  公式サイト     │
│  (index.html)   │
│  member-page    │
└─────────────────┘
```

### 重複チェックフロー（新）

2026-05-21 より、`name_select` フィールドによる重複チェック機能を追加：

```
Google フォーム送信
       ↓
既存データの取得
       ↓
name_select で既存チェック
       │
       ├── 既存あり → 更新処理 (PUT)
       │
       └── 既存なし → 新規作成 (POST)
```

**実装関数**:
- `storeInFirebaseWithDuplicateCheck()` - 重複チェックメイン処理
- `getExistingSubmissions()` - 既存データ取得
- `findExistingNameSelect()` - 既存レコード検索
- `updateExistingSubmission()` - 更新処理
- `createNewSubmission()` - 新規作成

**詳細**: [`code.gs`](functions/api/google-form-handler/code.gs:453-567) 参照

```
┌─────────────────┐
│  Google フォーム │
│  (メンバー情報入力)│
└────────┬────────┘
         │
         │ onFormSubmit トリガー
         ▼
┌─────────────────┐
│  Google Apps    │
│  Script (code.gs)│
│  - 質問項目の紐付け│
│  - ファイル処理  │
│  - 必須チェック  │
└────────┬────────┘
         │
         │ REST API (POST)
         ▼
┌─────────────────┐
│  Firebase       │
│  Realtime DB    │
│  /form_submissions│
└────────┬────────┘
         │
         │ リアルタイム同期
         ▼
┌─────────────────┐
│  公式サイト     │
│  (index.html)   │
│  member-page    │
└─────────────────┘
```

---

## Google フォーム質問項目一覧

### フォームヘッダー

| 項目 | 内容 |
|------|------|
| フォーム名 | 虎ノ門 VT メンバー登録フォーム（仮） |
| 回答先 | Google スプレッドシート連携 |
| トリガー | onFormSubmit (GAS 自動起動) |

### 質問項目とフィールドマッピング

`code.gs` の `FIELD_DEFINITIONS` に基づくマッピング一覧：

| No. | フィールドキー | 質問項目名（Google フォーム） | 型 | 必須 | 備考 |
|-----|---------------|---------------------------|-----|------|------|
| 1 | `name_select` | あなたの名前をプルダウンから選択して下さい。 | 文字列 | 必須 | 例：002_かか、003_ソクラテスオ |
| 2 | `sns_link` | SNSリンク | 文字列 | - | Twitter, YouTube 等へのリンク |
| 3 | `name_hiragana` | 名前（ひらがな） | 文字列 | **必須** | 例：やしゃひめ |
| 4 | `name_romaji` | 名前（ローマ字） | 文字列 | **必須** | 例：Yashahime |
| 5 | `birthday` | 誕生日 | 文字列 | - | 例：1 月 1 日 |
| 6 | `first_stream_date` | 初配信日 | 文字列 | - | 例：2024/04/01 |
| 7 | `height` | 身長 | 文字列 | - | 例：160cm |
| 8 | `image_color` | イメージカラー | 文字列 | - | 例：#38C8FF|
| 9 | `oshi_mark` | 推しマーク | 文字列 | - | 例：🐯 |
| 10 | `streaming_terms` | 配信用語 | 文字列 | - | 例：日本語、英語 |
| 11 | `unit_project_name` | ユニット・プロジェクト名 | 文字列 | - | 所属ユニット名 |
| 12 | `illustrator` | イラストレーター | 文字列 | - | イラスト作成者 |
| 13 | `modeler_2d` | 2D モデラー | 文字列 | - | 2D モデル作成者 |
| 14 | `modeler_3d` | 3D モデラー | 文字列 | - | 3D モデル作成者 |
| 15 | `fan_name` | ファンネーム | 文字列 | - | 公式ファンネーム |
| 16 | `official_hashtag` | 公式ハッシュタグ | 文字列 | - | 例：#虎ノ門VT |
| 17 | `streaming_schedule` | 配信予定 | 文字列 | - | 配信スケジュール |
| 18 | `recommended_video` | オススメ動画 | 文字列 | - | YouTube 等へのリンク |
| 19 | `announcement_event` | お知らせ・イベント予定 | 文字列 | - | 告知用 |
| 20 | `goods_music_link` | グッズ・音楽配信サイトリンク | 文字列 | - | 販売サイトへのリンク |
| 21 | `message_to_fans` | ファンへ一言 | 文字列 | - | コメント欄 |
| 22 | `qa` | Q＆A | 文字列 | - | 質問応答 |
| 23 | `header_image` | Web に公開するヘッダー画像をアップして下さい。 | ファイル | **必須** | Google Drive アップロード |
| 24 | `fullbody_image` | Web に公開する全身画像をアップして下さい。 | ファイル | **必須** | Google Drive アップロード |
| 25 | `voice_audio` | 自己紹介ページで再生されるボイスをアップして下さい。 | ファイル | - | 0-10 ファイル |
| 26 | `video` | 自己紹介ページに動画を流したい場合はアップして下さい。 | ファイル | - | Google Drive アップロード |
| 27 | `outer_image` | 自己紹介ページで表示する衣装画像をアップして下さい。（ 10MBずつ10ファイルまで） | ファイル | - | 0-10 ファイル |
| 28 | `three_view_image` | 自己紹介ページで表示する三面図画像をアップして下さい。（1ファイル10MBまで） | ファイル | - | 1 ファイル |
| 29 | `concept_image` | 自己紹介ページで表示するコンセプト画像をアップして下さい。（1ファイル10MBまで） | ファイル | - | 1 ファイル |
| 30 | `public_flag` | 公開可否フラグ | 選択 | **必須** | 「公開」「非公開」から選択 |

---

## Firebase データベース構造

### データベースパス

```
form_submissions/
  └─ {submission_id}/
       ├─ name_select
       ├─ sns_link
       ├─ name_hiragana
       ├─ name_romaji
       ├─ birthday
       ├─ first_stream_date
       ├─ height
       ├─ image_color
       ├─ oshi_mark
       ├─ streaming_terms
       ├─ unit_project_name
       ├─ illustrator
       ├─ modeler_2d
       ├─ modeler_3d
       ├─ fan_name
       ├─ official_hashtag
       ├─ streaming_schedule
       ├─ recommended_video
       ├─ announcement_event
       ├─ goods_music_link
       ├─ message_to_fans
       ├─ qa
       ├─ headerImageUrl
       ├─ fullbodyImageUrl
       ├─ voiceAudioUrls
        ├─ videoUrl
        ├─ outerImageUrls
        ├─ threeViewImageUrl
        ├─ conceptImageUrl
        ├─ public_flag
        ├─ submittedAt
        ├─ formSubmissionId
        ├─ formResponseId
        └─ timestamp
```

### データ構造（JSON 形式）

```json
{
  "form_submissions": {
    "-XYZ123abc": {
      "name_select": "001_夜叉姫",
      "name_hiragana": "やしゃひめ",
      "name_romaji": "Yashahime",
      "sns_link": "https://twitter.com/example",
      "birthday": "2024-01-01",
      "first_stream_date": "2024-04-01",
      "height": "160cm",
      "image_color": "赤、青",
      "oshi_mark": "🐯",
      "streaming_terms": "日本語、英語",
      "unit_project_name": "虎ノ門ナイト",
      "illustrator": "山田さん",
      "modeler_2d": "佐藤さん",
      "modeler_3d": "鈴木さん",
      "fan_name": "虎の子",
      "official_hashtag": "#虎ノ門 VT",
      "streaming_schedule": "毎週水曜日 21:00〜",
      "recommended_video": "https://youtube.com/watch?v=example",
      "announcement_event": "5 月 20 日ライブ配信予定",
      "goods_music_link": "https://example.com/goods",
      "message_to_fans": "いつもありがとうございます！",
      "qa": "Q: 趣味は？ A: ゲームです！",
      "headerImageUrl": "https://drive.google.com/file/d/HEADER_FILE_ID/view",
      "fullbodyImageUrl": "https://drive.google.com/file/d/FULLBODY_FILE_ID/view",
      "voiceAudioUrls": [
        "https://drive.google.com/file/d/VOICE1_FILE_ID/view",
        "https://drive.google.com/file/d/VOICE2_FILE_ID/view"
      ],
       "videoUrl": "https://drive.google.com/file/d/VIDEO_FILE_ID/view",
       "outerImageUrls": [
         "https://drive.google.com/file/d/OUTER1_FILE_ID/view",
         "https://drive.google.com/file/d/OUTER2_FILE_ID/view"
       ],
       "threeViewImageUrl": "https://drive.google.com/file/d/THREEVIEW_FILE_ID/view",
       "conceptImageUrl": "https://drive.google.com/file/d/CONCEPT_FILE_ID/view",
       "public_flag": "公開",
       "submittedAt": "2024-05-17T10:00:00.000Z",
       "formSubmissionId": "1234567890abcdef",
       "formResponseId": "anonymous",
       "timestamp": 1715943600000
    }
  }
}
```

### メタデータフィールド

| フィールド名 | 型 | 説明 | 自動生成 |
|------------|-----|--------|---------|
| `submittedAt` | ISO8601 文字列 | 送信日時（ISO 形式） | ○ |
| `formSubmissionId` | 文字列 | Google フォーム提出 ID | ○ |
| `formResponseId` | 文字列 | 回答者 ID（メールアドレス） | ○ |
| `timestamp` | 数値 | タイムスタンプ（ミリ秒） | ○ |

---

## フィールド変換マップ

### GAS での処理

`code.gs` の `handleFileUpload()` 関数で、Google Drive のファイル URL を生成：

```javascript
// Google Drive ファイル ID から共有 URL を生成
shareUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
```

### 画像 URL 変換

表示時には `getDriveImageProxy()` 関数で直接表示形式に変換：

| 元 URL 形式 | 変換後 URL 形式 |
|------------|----------------|
| `https://drive.google.com/file/d/[FILE_ID]/view` | `https://drive.google.com/uc?export=view&id=[FILE_ID]` |

---

## 必須項目

以下のフィールドは必須です。未入力の場合はエラーになります。

| フィールドキー | 質問項目名 | 備考 |
|---------------|-----------|------|
| `name_hiragana` | 名前（ひらがな） | - |
| `name_romaji` | 名前（ローマ字） | - |
| `header_image` | ヘッダー画像 | Google Drive アップロード |
| `fullbody_image` | 全身画像 | Google Drive アップロード |
| `public_flag` | 公開可否フラグ | 「公開」または「非公開」 |

---

## ファイルアップロードフィールド

### 対象フィールド

| フィールドキー | 形式 | 最大数 | 備考 |
|---------------|------|--------|------|
| `header_image` | 画像 | 1 | ヘッダー用 |
| `fullbody_image` | 画像 | 1 | サムネイル用 |
| `voice_audio` | 音声 | 10 | 複数可 |
| `video` | 動画 | 1 | 自己紹介用 |

### 保存形式

- **保存先**: Google Drive
- **アクセス権限**: 共有リンク（全員閲覧可能）
- **URL 形式**: `https://drive.google.com/file/d/[FILE_ID]/view`

---

## 公開フラグ仕様

### 値の形式

| 値 | 説明 | 表示 |
|----|------|------|
| `公開` | Web 公開する | 表示される |
| `公開する` | Web 公開する（別表現） | 表示される |
| `Web 公開` | Web 公開する（別表現） | 表示される |
| `非公開` | 内部でのみ使用 | 表示されない |
| `true` | 真偽値の場合 | 表示される |

### 判定ロジック

```javascript
// firebase-member-loader.js より
const flag = (member.public_flag || '').toString().replace(/\s/g, '');
if (flag.includes('Web') && flag.includes('公開') ||
    flag === '公開する' || flag === '公開' || flag === 'true') {
  // 公開メンバーとして表示
}
```

---

## 実装箇所

### Google Apps Script

| ファイル | 関数/処理 | 行番号 |
|---------|----------|--------|
| `code.gs` | `onFormSubmit()` | L73-204 |
| `code.gs` | `handleFileUpload()` | L323-401 |
| `code.gs` | `storeInFirebase()` | L408-452 |
| `code.gs` | `storeInFirebaseWithDuplicateCheck()` | L453-520 |
| `code.gs` | `getExistingSubmissions()` | L522-546 |
| `code.gs` | `findExistingNameSelect()` | L548-562 |
| `code.gs` | `updateExistingSubmission()` | L564-593 |
| `code.gs` | `createNewSubmission()` | L595-601 |
| `code.gs` | `FIELD_DEFINITIONS` | L16-49 |
| `code.gs` | `migrateSushiMarkToOshiMark()` | L760-819 |
| `code.gs` | `cleanupSushiMarkField()` | L821-878 |
| `code.gs` | `migrateStreamingLanguageToTerms()` | L893-951 |
| `code.gs` | `cleanupStreamingLanguageField()` | L953-1010 |

### マイグレーション関数（バージョン 1.2.0）

2026-05-21 のバージョン 1.2.0 アップデートで追加された関数：

1. **`migrateSushiMarkToOshiMark()`**: 既存の `sushi_mark` フィールドの値を `oshi_mark` にコピー
2. **`cleanupSushiMarkField()`**: 全レコードから `sushi_mark` フィールドを削除

**使用手順**:
1. `migrateSushiMarkToOshiMark()` を実行（全レコードに `oshi_mark` を追加）
2. `cleanupSushiMarkField()` を実行（古い `sushi_mark` を削除）
3. 完了後、Firebase コンソールで `oshi_mark` のみ残っていることを確認

### マイグレーション関数（バージョン 1.3.0）

2026-05-21 のバージョン 1.3.0 アップデートで追加された関数：

1. **`migrateStreamingLanguageToTerms()`**: 既存の `streaming_language` フィールドの値を `streaming_terms` にコピー
2. **`cleanupStreamingLanguageField()`**: 全レコードから `streaming_language` フィールドを削除

**使用手順**:
1. `migrateStreamingLanguageToTerms()` を実行（全レコードに `streaming_terms` を追加）
2. `cleanupStreamingLanguageField()` を実行（古い `streaming_language` を削除）
3. 完了後、Firebase コンソールで `streaming_terms` のみ残っていることを確認

### クライアントサイド

| ファイル | 関数/処理 | 行番号 |
|---------|----------|--------|
| `index.html` | `FirebaseMemberListLoader.renderMembers()` | L312-366 |
| `firebase-member-loader.js` | `MemberDataLoader.getPublicMembers()` | L112-138 |
| `firebase-member-loader.js` | `getDriveImageProxy()` | L312-323 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|-----------|----------|------|
| 2026-05-20 | 1.0.0 | 初版作成 - Google フォーム質問項目と Firebase 構造を文書化 | - |
| 2026-05-21 | 1.1.0 | `name_select` による重複チェック機能追加 - 同じメンバーの重複登録を防止 | - |
| 2026-05-21 | 1.2.0 | `sushi_mark` フィールド名を `oshi_mark` に変更 - 既存データはマイグレーション関数で変換済み | - |
| 2026-05-21 | 1.3.0 | `streaming_language` フィールド名を `streaming_terms` に変更 - 既存データはマイグレーション関数で変換済み | - |
| 2026-05-30 | 1.4.1 | 衣装画像（outer_image）、三面図画像（three_view_image）、コンセプト画像（concept_image）フィールド追加 - 最大10枚の衣装画像を配列で保存、クリックで画像切替機能を実装 | - |

---

## 関連ドキュメント

- [IMAGE_SPEC.md](./IMAGE_SPEC.md) - 画像仕様
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase 設定
- [functions/api/google-form-handler/README.md](./functions/api/google-form-handler/README.md) - GAS 処理詳細
- [functions/api/google-form-handler/code.gs](./functions/api/google-form-handler/code.gs) - GAS ソースコード
