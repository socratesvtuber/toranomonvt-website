# Google Form × Firebase 連携機能 - 統合ドキュメント

## 概要

このドキュメントでは、Google フォームからの回答を Firebase Realtime Database に自動保存し、保存されたデータを Web サイト上でリアルタイムに表示する一連のシステムについて説明します。

## システム構成

```
Google Form → Google Apps Script → Firebase Realtime Database → Web サイト
     ↓              ↓                    ↓                      ↓
  回答入力     データ解析・保存     データ格納・配信      表示・更新
```

## 作成されたファイル一覧

### Google Apps Script (GAS) 関連

| ファイル | 場所 | 説明 |
|----------|------|------|
| `code.gs` | `functions/api/google-form-handler/` | メインスクリプト（`onFormSubmit` 関数） |
| `config.gs.example` | `functions/api/google-form-handler/` | 設定テンプレート |
| `appsscript.json` | `functions/api/google-form-handler/` | GAS プロジェクト設定 |

### Web サイト関連

| ファイル | 場所 | 説明 |
|----------|------|------|
| `firebase-member-loader.js` | ルート | メンバーページ用データローダー |
| `members/member.html` | `members/` | 動的メンバーページテンプレート |
| `index.html` | ルート | トップページ（メンバー一覧 更新済み） |

### ドキュメント類

| ファイル | 場所 | 説明 |
|----------|------|------|
| `README.md` | `functions/api/google-form-handler/` | 英語ドキュメント |
| `SETUP_GUIDE_JA.md` | `functions/api/google-form-handler/` | 日本語セットアップガイド |
| `FILES_SUMMARY.md` | `functions/api/google-form-handler/` | ファイル概要 |
| `sample-data.json` | `functions/api/google-form-handler/` | データ構造サンプル |
| `firebase-rules.json` | `functions/api/google-form-handler/` | Firebase セキュリティルール |

## 主要機能

### 1. Google フォーム → Firebase 自動保存

- **トリガー**: フォーム送信時
- **処理**: 
  - 全 29 項目を indexOf() で解析
  - ファイルアップロードは Google Drive 共有リンクに変換
  - 音声ファイルは 0-10 個まで対応
  - Firebase に JSON 形式で保存

### 2. データベース構造

```json
{
  "form_submissions": {
    "-UNIQUE_ID": {
      "name_hiragana": "やしゃひめ",
      "name_romaji": "Yasahime",
      "headerImageUrl": "https://drive.google.com/...",
      "fullbodyImageUrl": "https://drive.google.com/...",
      "voiceAudioUrls": ["url1", "url2"],
      "videoUrl": "https://drive.google.com/...",
      "public_flag": "する",
      "timestamp": 1704067200000
    }
  }
}
```

### 3. Web サイト側機能

#### トップページ (`index.html`)
- Firebase からメンバー一覧を自動取得
- `public_flag` が「する」のメンバーのみ表示
- 30 秒ごとに自動更新（リアルタイム監視）
- データがない場合は静的フォールバック表示

#### メンバーページ (`members/member.html`)
- URL パラメータ `?name=` でメンバーを特定
- Firebase データを元に動的にレンダリング
- 音声再生機能
- お気に入り機能
- メンバー間ナビゲーション

## セットアップ手順

### ステップ 1: Firebase 準備

1. Firebase プロジェクト作成
2. Realtime Database 有効化
3. セキュリティルール設定
4. データベース URL を控える

### ステップ 2: Google Drive 準備

1. アップロード用フォルダ作成
2. フォルダ ID を取得

### ステップ 3: Google Apps Script 設定

1. Google フォーム → スクリプトエディタ
2. `code.gs` をコピー
3. `config.gs` を作成し設定値を記入
4. トリガー設定（`onFormSubmit`）

### ステップ 4: Web サイト更新

1. `firebase-member-loader.js` を配置
2. `index.html` を更新
3. `members/member.html` を配置

## データフロー

### 新規メンバー追加時

1. メンバーが Google フォームに回答
2. 必須項目（名前、画像、公開フラグ）を入力
3. 送信ボタンを押す
4. GAS が Firebase に保存
5. トップページに自動表示（30 秒以内）
6. `members/member.html?name=名前` で個別ページ表示

### 既存メンバーのデータ更新時

1. メンバーが Google フォームを再送信
2. 更新データが Firebase に上書き保存
3. Web サイトが 30 秒ごとに自動更新
4. 全ユーザーに最新データが表示

## 使用技術

- **Google Apps Script**: フォーム送信処理
- **Firebase Realtime Database**: データ保存・リアルタイム同期
- **Google Drive**: ファイルストレージ
- **JavaScript (ES6+)**: クライアント側処理
- **HTML/CSS**: レイアウト

## セキュリティ

1. **config.gs の管理**: `.gitignore` で除外
2. **Firebase Rules**: 読み取り専用（公開）
3. **Google Drive**: 共有リンクは閲覧者のみ
4. **XSS 対策**: HTML エスケープ処理済み

## エラーハンドリング

- データ取得失敗時はフォールバック表示
- エラーログは Firebase に保存
- クライアント側でエラーメッセージ表示

## パフォーマンス

- 初回読み込み：約 1-2 秒
- データ更新：30 秒ごと
- ファイルサイズ：画像は圧縮推奨

## 制限事項

- 音声ファイル：最大 10 個まで
- 1 ファイルサイズ：Google Drive 制限（15GB）
- 同時接続：Firebase 無料枠の範囲内

## 今後の拡張

- [ ] 管理者画面の追加
- [ ] 編集機能の追加
- [ ] 画像の圧縮処理
- [ ] ページネーション
- [ ] 検索機能

## サポート

問題発生時：
1. `SETUP_GUIDE_JA.md` を確認
2. Firebase コンソールでログ確認
3. GAS の実行情報を確認

## ライセンス

このプロジェクトは虎ノ門 VT コミュニティのために作成されました。
