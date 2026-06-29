# 画像仕様マニュアル

このドキュメントでは、虎ノ門 VT 公式サイトで使用される画像の仕様について記載しています。

**最終更新日**: 2026-06-29
**バージョン**: 1.3.0

---

## 目次

1. [トップページ メンバーサムネイル画像](#トップページメンバーサムネイル画像)
2. [使用画像ファイル一覧](#使用画像ファイル一覧)
3. [変更履歴](#変更履歴)

---

## トップページ メンバーサムネイル画像

### 概要

トップページ（`index.html`）のメンバーセクションに表示されるサムネイル画像の仕様です。

### データフロー

```
Google フォーム入力
       ↓
Firebase Realtime Database (/form_submissions)
       ↓
index.html (FirebaseMemberListLoader)
       ↓
サムネイル表示
```

**注意**: 2026-05-21 より、`name_select` による重複チェック機能が追加されました。
同じメンバーの画像が重複して保存されることを防いでいます。

### 画像ソース

| 項目 | 内容 |
|------|------|
| **保存元** | Firebase Realtime Database `/form_submissions` |
| **フィールド名** | `fullbodyImageUrl` |
| **形式** | Google Drive ファイル URL |
| **例** | `https://drive.google.com/file/d/[FILE_ID]/view` |

### 変換処理

`index.html` および `firebase-member-loader.js` 内の `getDriveImageProxy()` 関数で、Google Drive のファイル URL を直接表示可能な形式に変換しています。

**変換前**:
```
https://drive.google.com/file/d/[FILE_ID]/view
```

**変換後**:
```
https://lh3.googleusercontent.com/d/[FILE_ID]
```

### URL形式の重要事項

- **画像URL**は必ず`https://lh3.googleusercontent.com/d/{ファイルID}`形式に変換してください
- この形式はGoogleドライブの画像を直接表示できる代理URLです
- `drive.google.com/file/d/...`形式のままでは、ブラウザのセキュリティポリシーにより表示エラーが発生する可能性があります
- 音声ファイルは`<audio>`タグではなく、iframe埋め込みを使用してください

### ソースコード

```javascript
// firebase-member-loader.js より（画像用）
getDriveImageProxy(driveUrl) {
  if (!driveUrl) return '../img/虎ノ門ロゴ大本.png';

  const fileMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    const fileId = fileMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return driveUrl;
}

// firebase-member-loader.js より（音声iframe用）
getVoicePreviewUrl(driveUrl) {
  if (!driveUrl) return '';
  const fileMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  return '';
}
```

**index.html L401-411 より（トップページメンバーアバター用）**
```javascript
getDriveImageProxy(driveUrl) {
  if (!driveUrl) return '';

  const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return driveUrl;
}
```

### フォールバック画像

`fullbodyImageUrl` が設定されていない場合、CSS で定義されたアバター画像が使用されます。

| クラス | 画像ファイル | パス |
|--------|-------------|------|
| `avatar-1` | 夜叉さんアイコン | `img/夜叉さんアイコン_1080_1080.jpeg` |
| `avatar-2` | かかちゃん寝てる | `img/かかちゃん寝てる.webp` |
| `avatar-3` | ソクラテスオ驚き | `img/ソクラテスオ驚き.png` |

### 実装箇所

| 機能 | ファイル | 行番号 |
|------|---------|--------|
| メンバーデータ読み込み | `firebase-member-loader.js` | L141-205 |
| メンバー表示レンダリング | `firebase-member-loader.js` | L358-527 |
| 画像 URL 変換（画像用） | `firebase-member-loader.js` | L966-991 |
| 音声 URL 変換（iframe用） | `firebase-member-loader.js` | L994-1002 |
| トップページメンバーリスト | `index.html` | L258-310 |
| トップページアバター変換 | `index.html` | L401-411 |
| CSS アバタースタイル | `styles.css` | L504-525 |
| Boise iframe 埋め込み | `members/member.html` | L82-84 |
| Boise iframe 埋め込み | `members/kaka.html` | L57-65 |
| Boise iframe 埋め込み | `members/yasahime.html` | L57-65 |
| Boise iframe 埋め込み | `members/sokrates.html` | L57-65 |

---

## 使用画像ファイル一覧

### ローカル画像（img/ディレクトリ）

| ファイル名 | 用途 |
|-----------|------|
| `虎ノ門ロゴ大本.png` | サイトヘッダーロゴ |
| `虎ノ門ロゴ分割 1.png` | 未使用 |
| `虎ノ門ロゴ分割 2.png` | 未使用 |
| `虎ノ門ロゴ分割 3.png` | 未使用 |
| `虎ノ門ロゴ AI 修正.png` | 未使用 |
| `夜叉さんアイコン_1080_1080.jpeg` | メンバーアバター（avatar-1） |
| `かかちゃん寝てる.webp` | メンバーアバター（avatar-2） |
| `ソクラテスオ驚き.png` | メンバーアバター（avatar-3） |

### 外部画像

| ソース | 形式 | 用途 |
|--------|------|------|
| Google Drive | `fullbodyImageUrl` | メンバーサムネイル |
| Google Drive | `headerImageUrl` | メンバーヘッダー画像 |
| Google Drive | `conceptImageUrl` | コンセプト画像 |
| Google Drive | `threeViewImageUrl` | 三面図画像 |
| Google Drive | `outerImageUrls[]` | 衣装画像 |
| Google Drive | `voiceAudioUrls[]` | 音声ファイル（`uc?export=download`形式を使用） |

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|-----------|----------|------|
| 2026-05-20 | 1.0.0 | 初版作成 - メンバーサムネイル画像の仕様を文書化 | - |
| 2026-05-21 | 1.1.0 | `name_select` による重複チェック機能追加の注記を追加 | - |
| 2026-05-31 | 1.2.0 | 画像URLを`lh3.googleusercontent.com/d/{fileId}`形式に変換するよう修正。音声URLは`uc?export=download`形式を使用 | - |
| 2026-06-29 | 1.3.0 | 音声再生をGoogle Drive iframe埋め込み形式に変更。個別ボイスボタンを廃止し、iframeプレイヤーを導入 | - |

---

## 音声ファイルの仕様

### 概要

音声ファイル（ボイス）のホスティングは、Google Driveの制約により注意が必要です。

### Google Drive音声の制約

- **2024年1月頃から外部サイトからの音声再生が制限**されています
- `https://drive.google.com/file/d/{fileId}/view`形式はブラウザのセキュリティポリシーによりエラーになります
- `https://drive.google.com/uc?export=download&id={fileId}`形式も、GoogleのCORS/認証制約により再生できないケースがあります

### 推奨：Google Drive iframe埋め込み形式

Google Driveの音声ファイルは、以下のiframe形式で埋め込むことで外部サイトからの再生が可能になります：

```
<iframe src="https://drive.google.com/file/d/{FILE_ID}/preview" style="width: 100%; height: 80px; border: none; border-radius: 8px;"></iframe>
```

**例**:
```html
<iframe src="https://drive.google.com/file/d/1ZmK9SvG3dV3MtM8PsmsAfxkwmutZfh21/preview" style="width: 100%; height: 80px; border: none; border-radius: 8px;"></iframe>
```

#### iframe埋め込みの利点

| 方法 | URL形式 | 再生可否 | 備考 |
|------|--------|---------|------|
| Google Drive（view） | `drive.google.com/file/d/.../view` | ❌ | エラー表示のみ |
| Google Drive（download） | `drive.google.com/uc?export=download&id=...` | ⚠️ | 制約により不安定 |
| Google Drive（iframe） | `drive.google.com/file/d/.../preview` | ✅ | 推奨方法（2026年現在） |
| Firebase Storage | `firebasestorage.googleapis.com/.../o/...?alt=media` | ✅ | 推奨（別途設定要） |

### Firebase Storageへの移行方法

音声ファイルはFirebase Storageへアップロードすることを推奨します：

1. **GAS設定**: `config.gs`に`FIREBASE_STORAGE_BUCKET`を設定
   ```javascript
   var FIREBASE_STORAGE_BUCKET = 'toranomonvt-website.appspot.com';
   ```

2. **フォーム送信時**: Googleフォームから音声を送信すると、GASが自動的にFirebase Storageにアップロード

3. **注意**: 既存の`drive.google.com/file/d/...`形式のURLは移行前のデータです。新規送信で上書きしてください。

### 音声URL変換処理

`firebase-member-loader.js`の`getVoiceStreamUrl()`は、Google Driveの制約により現在は使用していません。フォーム送信時にGAS側で`uc?export=download&confirm=no_antivirus`形式に変換されます。

### Google Drive音声のベストプラクティス（2026年現在）

Google Driveでは、2024年1月頃から以下の制約があります：

1. **外部再生不可**: `drive.google.com/file/d/...`からの直接`<audio>`タグ再生はブロック
2. **CORS制限**: `uc?export=download`もブラウザのCORSポリシーによりエラーになるケースが多い
3. **認証必須**: 再生にはGoogle認証が必要な場合がある

### 推奨される代替方法（Firebase Storage使用不可の場合）

**方法1: GASサーバー側プロキシ（制限あり)**
```
https://script.google.com/macros/s/[SCRIPT_ID]/exec?type=audio&id=[FILE_ID]
```
- GASの`doGet`でファイルを配信
- ただし、ContentServiceはCORSヘッダーを設定できないため、同一オリジン限定

**方法2: GitHubリポジトリ無料ホスティング**
1. 音声ファイルをGitHubリポジトリにアップロード
2. Raw URLを使用: `https://raw.githubusercontent.com/[USER]/[REPO]/[BRANCH]/[PATH]/[FILENAME].mp3`
3. ユーザー認証不要、CORS制限なし

**方法3: Dropbox（無料プランあり)**
- Dropboxの共有リンクを`dl=1`パラメータ付きで使用
- `https://www.dropbox.com/s/[ID]/[FILENAME]?dl=1`

**方法4: SoundCloud（音声専用)**
- 音声ファイルをSoundCloudにアップロード
- oEmbed APIや直接埋め込みで使用

### 重要な制約

Google Driveの音声ファイルは、「リンクを知っている全員」が閲覧可能な設定でも、外部サイトからのiframe埋め込みはCSP（Content Security Policy）制限によりブロックされます。

### 必須: Firebase Storageへの移行

音声ファイルはFirebase Storageへアップロードすることを推奨します：

1. **GAS設定**: `config.gs`の`FIREBASE_STORAGE_BUCKET`を設定
   ```javascript
   var FIREBASE_STORAGE_BUCKET = 'toranomonvt-website.appspot.com';
   ```

2. **Firebase Storageルール**: 下記を設定
   ```
   service firebase.storage {
     match /b/{bucket}/o {
       match /voice/{allPaths=**} {
         allow read: if true;
       }
     }
   }
   ```

3. フォーム送信時にGASが自動的にFirebase Storageにアップロード
   - 成功: Firebase StorageのURL（`<audio>`タグで再生可能）
   - 失敗: Google Drive download URL（制限あり）

---

## 関連ドキュメント

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase 設定
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - 統合概要
- [README.md](./README.md) - プロジェクト概要
