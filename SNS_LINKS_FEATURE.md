# SNS リンク機能

## 概要
メンバーの自己紹介ページに SNS リンクを表示する機能。複数の SNS URL を登録可能で、プラットフォームごとにアイコンと色を自動で設定。

## 実装日
2026-05-22

## 機能説明

### データ形式
- DB には複数の URL を改行 (`\n`) またはコンマ (`,`) で区切って保存
- 例：
  ```
  https://twitter.com/example
  https://youtube.com/@example
  https://www.twitch.tv/example
  ```

### サポートされているプラットフォーム
| プラットフォーム | アイコン | 色 |
|-----------------|---------|-----|
| YouTube | `fab fa-youtube` | Red (#ff0000) |
| Twitch | `fab fa-twitch` | Purple (#9146ff) |
| ニコニコ動画 | `fas fa-tv` | Cyan (#03c7fc) - 公式カラー |
| X (Twitter) | `fa-brands fa-x-twitter` | Black (#000000) - 公式ロゴ |
| Instagram | `fab fa-instagram` | Gradient (pink/orange) |
| Facebook | `fab fa-facebook` | Blue (#1877f2) |
| TikTok | `fab fa-tiktok` | Black (#000000) |
| Discord | `fab fa-discord` | Blurple (#5865f2) |
| note | `fas fa-pen-fancy` | Green (#2fb66d) |
| pixiv | `fas fa-palette` | Teal (#00a877) |
| BOOTH | `fas fa-store` | Orange (#ff6600) |
| Spotify | `fab fa-spotify` | Green (#1ed761) |
| Apple | `fab fa-apple` | Black (#000000) |
| Amazon | `fab fa-amazon` | Orange (#ff9900) |
| marshmallow | `fas fa-cookie` | Pink (#ff6b9d) - マシュマロ風 |
| Lit-Link | `fas fa-link` | Blue (#4cb4e2) - 公式カラー |
| その他 | `fas fa-link` | Gold (theme color) |

## 実装詳細

### 変更ファイル

#### 1. `firebase-member-loader.js`
- `renderSnsLinks()` 関数の修正
  - 複数の URL を改行とコンマで分割
  - 各 URL ごとにプラットフォーム検出とアイコン表示
- `getPlatformInfo()` 関数の追加
  - URL を元にプラットフォームを自動判別
  - 適切なアイコンクラスと色を返す

#### 2. `member-page.css`
- 各プラットフォーム用のカラークラスを追加
- `.sns-icon.youtube`, `.sns-icon.twitch` など
- ホバーエフェクトも各プラットフォームの色に対応

#### 3. `members/member.html`
- セクション見出しを「SNS リンク」に変更（元：「SNS・リンク」）

## 使い方

### Google フォームでの入力方法
SNS リンクフィールドに複数の URL を入力：
```
https://twitter.com/username
https://youtube.com/@channel
https://www.twitch.tv/username
```

### 表示例
メンバーページに各プラットフォームのアイコンが並んで表示されます：
- YouTube のアイコン（赤）
- Twitch のアイコン（紫）
- X のアイコン（黒）

## 技術仕様

### プラットフォーム検出ロジック
```javascript
getPlatformInfo(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return { class: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' };
  }
  // ... 他のプラットフォーム
}
```

### CSS クラス設計
```css
.sns-icon { /* ベーススタイル */ }
.sns-icon.youtube { /* YouTube 用 */ }
.sns-icon.twitch { /* Twitch 用 */ }
/* ... 各プラットフォーム */
```

## 依存関係
- Font Awesome 6.4.0+ (アイコン表示)
- Firebase Realtime Database (データ保存)

## 関連ドキュメント
- [FORM_DB_SPEC.md](FORM_DB_SPEC.md) - データベース仕様
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase 設定ガイド

---

# Q&A 機能

## 概要
メンバーの自己紹介ページに Q&A セクションを表示する機能。質問と回答のペアを適切に表示。

## データ形式
DB には以下の形式で Q&A を保存します：

```
Q1: 趣味は何ですか？
A1: ゲームとアニメ鑑賞です。
Q2: 好きな食べ物は？
A2: 寿司とラーメンです。
```

または

```
Q: 趣味は何ですか？
A: ゲームとアニメ鑑賞です。
Q: 好きな食べ物は？
A: 寿司とラーメンです。
```

### 入力形式のルール
- 質問は `Q`, `Q:`, `Q.`, `QA:`, `QA.`, `質問` のいずれかで始まる
- 回答は `A`, `A:`, `A.`, `回答` のいずれかで始まる
- 質問と回答は交互に入力
- 質問の後に回答がない場合、「回答未入力」と表示される

## 実装詳細

### 変更ファイル

#### 1. `firebase-member-loader.js`
- `renderQa()` 関数の修正
  - 新しい `parseQaPairs()` 関数を使用して Q&A ペアを解析
- `parseQaPairs()` 関数の追加
  - 質問と回答をペアとして抽出
  - 様々な Q/A 形式をサポート（Q, Q:, QA:, 質問，など）

## 表示例
メンバーページの Q&A セクションに、アコーディオン形式で表示：
- 質問をクリックすると回答が展開される
- 複数の Q&A ペアを整理して表示

## 技術仕様

### パースロジック
```javascript
// 質問の検出
const isQuestion = /^Q[.:]?\s*|^QA[.:]?\s*|^質問/.test(line);
// 回答の検出
const isAnswer = /^A[.:]?\s*|^回答/.test(line);
```

### 対応形式
- `Q: 質問文` / `A: 回答文`
- `Q. 質問文` / `A. 回答文`
- `Q1: 質問文` / `A1: 回答文`
- `QA: 質問文` / `A: 回答文`
- `質問 質問文` / `回答 回答文`

## 関連ドキュメント
- [FORM_DB_SPEC.md](FORM_DB_SPEC.md) - データベース仕様
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase 設定ガイド
