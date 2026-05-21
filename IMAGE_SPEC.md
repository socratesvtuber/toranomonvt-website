# 画像仕様マニュアル

このドキュメントでは、虎ノ門 VT 公式サイトで使用される画像の仕様について記載しています。

**最終更新日**: 2026-05-21
**バージョン**: 1.1.0

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

`index.html` 内の `getDriveImageProxy()` 関数（L392-402）で、Google Drive のファイル URL を直接表示可能な形式に変換しています。

**変換前**:
```
https://drive.google.com/file/d/[FILE_ID]/view
```

**変換後**:
```
https://drive.google.com/uc?export=view&id=[FILE_ID]
```

### ソースコード

```javascript
// index.html L392-402 より
getDriveImageProxy(driveUrl) {
  if (!driveUrl) return '';

  const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
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
| メンバーデータ読み込み | `index.html` | L258-310 |
| メンバー表示レンダリング | `index.html` | L312-366 |
| 画像 URL 変換 | `index.html` | L392-402 |
| CSS アバタースタイル | `styles.css` | L504-525 |

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

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|-----------|----------|------|
| 2026-05-20 | 1.0.0 | 初版作成 - メンバーサムネイル画像の仕様を文書化 | - |
| 2026-05-21 | 1.1.0 | `name_select` による重複チェック機能追加の注記を追加 | - |

---

## 関連ドキュメント

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase 設定
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - 統合概要
- [README.md](./README.md) - プロジェクト概要
