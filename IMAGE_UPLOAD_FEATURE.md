# 画像アップロード機能マニュアル

## 概要

このドキュメントでは、Google フォームからアップロードされたヘッダー画像と全身画像を Firebase に保存し、Web サイト上で表示する機能について説明します。

## 画像の用途

| 項目 | 用途 | 使用箇所 |
|------|------|----------|
| `header_image` | ヘッダー画像 | - トップページメンバーカードのサムネイル<br>- メンバーページのヘッダー背景 |
| `fullbody_image` | 全身画像 | - メンバーページのアバター画像 |

## データフロー

```
Google フォーム → Google Apps Script → Firebase Realtime Database → Web サイト
```

## 1. Google フォームでの画像アップロード

### フォーム項目

| フィールド名 | 表示名 | 形式 |
|-------------|--------|------|
| `header_image` | Web に公開するヘッダー画像をアップして下さい。（1 ファイル 10MB まで） | ファイルアップロード |
| `fullbody_image` | Web に公開する全身画像をアップして下さい。（1 ファイル 10MB まで） | ファイルアップロード |

### 注意点

- 各画像は 1 ファイル 10MB まで
- Google フォームのフィールド名は正確に一致させる必要あり
- 日本語の括弧「（）」が含まれているため注意

## 2. Google Apps Script 側処理

### ファイル
[`functions/api/google-form-handler/code.gs`](functions/api/google-form-handler/code.gs)

### 主要な定数

```javascript
// フィールド定義（行 31-35 付近）
const FIELD_DEFINITIONS = {
    // ...
    'header_image': 'Web に公開するヘッダー画像をアップして下さい。（1 ファイル 10MB まで）',
    'fullbody_image': 'Web に公開する全身画像をアップして下さい。（1 ファイル 10MB まで）',
};

// ファイルアップロードフィールド（行 51-57 付近）
const FILE_UPLOAD_FIELDS = {
    'header_image': 'Web に公開するヘッダー画像をアップして下さい。（1 ファイル 10MB まで）',
    'fullbody_image': 'Web に公開する全身画像をアップして下さい。（1 ファイル 10MB まで）',
};
```

### ファイルアップロード処理

`handleFileUpload` 関数（行 329 付近）で画像 URL を処理：

```javascript
if (fieldKey === 'header_image') {
    result.headerImageUrl = shareUrl;
} else if (fieldKey === 'fullbody_image') {
    result.fullbodyImageUrl = shareUrl;
}
```

## 3. Firebase 側データ構造

### データベースパス
`/form_submissions/{submissionId}`

### 保存データ例

```json
{
  "headerImageUrl": "https://drive.google.com/file/d/[FILE_ID]/view",
  "fullbodyImageUrl": "https://drive.google.com/file/d/[FILE_ID]/view",
  "name_hiragana": "メンバー名",
  // ... その他のフィールド
}
```

## 4. フロントエンド側処理

### ファイル
[`firebase-member-loader.js`](firebase-member-loader.js)

### データ取得処理

**行数**: 141-190 行目  
**関数**: `async loadMemberById(memberId)`

Firebase Realtime Database からメンバーデータを取得します。

### 画像表示処理

**行数**: 340-454 行目  
**関数**: `renderMemberPage(member)`

#### ヘッダー画像の表示（355-366 行目）

```javascript
// Header image (from headerImageUrl - Google Drive)
const headerImageEl = document.getElementById('member-header-image');
if (headerImageEl) {
    if (member.headerImageUrl) {
        console.log('DEBUG - Setting header image:', this.getDriveImageProxy(member.headerImageUrl));
        headerImageEl.src = this.getDriveImageProxy(member.headerImageUrl);
        headerImageEl.style.display = 'block';
    } else {
        console.log('DEBUG - No headerImageUrl found');
        headerImageEl.style.display = 'none';
    }
}
```

#### 全身画像（アバター）の表示（372-382 行目）

```javascript
// Avatar (from fullbodyImageUrl - Google Drive)
const avatarEl = document.getElementById('member-avatar');
if (member.fullbodyImageUrl) {
    console.log('DEBUG - Setting avatar image:', this.getDriveImageProxy(member.fullbodyImageUrl));
    avatarEl.src = this.getDriveImageProxy(member.fullbodyImageUrl);
    avatarEl.alt = member.name_hiragana || 'メンバー';
} else {
    console.log('DEBUG - No fullbodyImageUrl found, using fallback');
    avatarEl.src = '../img/虎ノ門ロゴ大本.png';
    avatarEl.alt = 'メンバー画像';
}
```

### URL 変換処理

**行数**: 811-821 行目  
**関数**: `getDriveImageProxy(driveUrl)`

Google Drive の共有 URL を直接表示可能な形式に変換します。

```javascript
getDriveImageProxy(driveUrl) {
    if (!driveUrl) return '';
    // https://drive.google.com/file/d/[FILE_ID]/view
    // または
    // https://drive.google.com/file/d/[FILE_ID]/view?usp=drive_link
    // から
    // https://drive.google.com/uc?export=view&id=[FILE_ID]
    // に変換
    const match = driveUrl.match(/\/file\/d\/([^\/\?]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return driveUrl;
}
```

## 5. トップページ（メンバー一覧）のサムネイル表示

### ファイル
[`index.html`](index.html:351-357)

### 実装

```javascript
const avatarUrl = member.headerImageUrl
    ? this.getDriveImageProxy(member.headerImageUrl)
    : (member.fullbodyImageUrl
        ? this.getDriveImageProxy(member.fullbodyImageUrl)
        : '');
```

### 優先順位

1. `headerImageUrl` があれば使用
2. なければ `fullbodyImageUrl` を使用
3. どちらもなければ画像なし

## 6. CSS スタイル

### ファイル
[`member-page.css`](member-page.css)

### ヘッダー画像コンテナ（18-45 行目付近）

```css
.member-header-image-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    overflow: hidden;
    border-radius: 16px;
    z-index: -1;
}

.member-header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.15;
}
```

## 7. デバッグ方法

### コンソールログ

デバッグ用のログが以下の箇所に出力されます：

1. **メンバーページ読み込み時**:
   - `FirebaseMemberLoader: Rendering member page: {メンバー名}`
   - `DEBUG - Full member data: {完全なデータ}`
   - `DEBUG - headerImageUrl: {URL}`
   - `DEBUG - fullbodyImageUrl: {URL}`

2. **画像設定時**:
   - `DEBUG - Setting header image: {URL}`
   - `DEBUG - Setting avatar image: {URL}`
   - `DEBUG - No headerImageUrl found`
   - `DEBUG - No fullbodyImageUrl found, using fallback`

3. **トップページ**:
   - `DEBUG member[{インデックス}]: {メンバーデータ}`
   - `DEBUG member.fullbodyImageUrl: {URL}`
   - `DEBUG member.headerImageUrl: {URL}`

### 確認手順

1. ブラウザの開発者ツールを開く（F12）
2. Console タブを選択
3. メンバーページまたはトップページをリロード
4. ログ出力を確認

## 8. 既知の問題と注意点

### 古いメンバーデータについて

画像アップロード機能の修正前に作成されたメンバーデータには、`headerImageUrl` と `fullbodyImageUrl` のフィールドが存在しません。

**対応方法**:
- 該当メンバーの Google フォームを再送信する
- または Firebase コンソールから直接データを更新する

### URL 形式について

- **保存形式**: `https://drive.google.com/file/d/[FILE_ID]/view`
- **表示形式**: `https://drive.google.com/uc?export=view&id=[FILE_ID]`

`getDriveImageProxy()` 関数が自動で変換しますが、必要に応じて手動でも変換可能です。

## 9. 更新履歴

| 日付 | 更新内容 |
|------|----------|
| 2024-05-23 | 初版作成 |

## 10. 関連ドキュメント

- [`FORM_DB_SPEC.md`](FORM_DB_SPEC.md) - フォームと DB の仕様
- [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) - Firebase のセットアップ
- [`INTEGRATION_SUMMARY.md`](INTEGRATION_SUMMARY.md) - 統合の概要
