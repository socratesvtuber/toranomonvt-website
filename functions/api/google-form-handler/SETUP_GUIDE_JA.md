# Google Form × Firebase 連携セットアップガイド

このドキュメントでは、Google フォームの回答を Firebase Realtime Database に自動保存するシステムのセットアップ方法を解説します。

## 目次

1. [事前準備](#事前準備)
2. [Firebase の設定](#firebase-の設定)
3. [Google Drive の設定](#google-drive-の設定)
4. [Google Apps Script の設定](#google-apps-script-の設定)
5. [Google フォームの設定](#google-フォームの設定)
6. [トリガーの設定](#トリガーの設定)
7. [動作確認](#動作確認)
8. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

必要なもの：
- Google アカウント
- Firebase プロジェクト（無料枠で OK）
- Google フォーム
- Google Drive

---

## Firebase の設定

### ステップ 1: Firebase プロジェクトの作成

1. [Firebase コンソール](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：`toranomon-vt`）
4. Google Analytics は必要に応じて有効化

### ステップ 2: Realtime Database の作成

1. 左メニューから「Build」→「Realtime Database」を選択
2. 「データベースを作成」をクリック
3. ロケーションを選択（アジア：日本 `asia-southeast1` または `asia-northeast1` がおすすめ）
4. セキュリティルールは「テストモード」で開始（後で変更）

### ステップ 3: データベース URL の確認

1. Realtime Database の「データ」タブを表示
2. 上部の「︙」→「データベースの URL をコピー」を選択
3. または、設定（歯車アイコン）→「プロジェクトの設定」で確認
4. URL 形式：`https://[プロジェクト ID].firebaseio.com`

**重要**: この URL を控えてください（後で使用します）

### ステップ 4: セキュリティルールの設定

Firebase コンソールの Realtime Database →「ルール」タブで以下を設定：

```json
{
  "rules": {
    "form_submissions": {
      ".read": true,
      ".write": false,
      "$submissionId": {
        ".read": true,
        ".write": false,
        ".indexOn": ["timestamp", "public_flag"]
      }
    },
    "form_errors": {
      ".read": "auth != null",
      ".write": false
    }
  }
}
```

---

## Google Drive の設定

### ステップ 1: アップロード用フォルダの作成

1. [Google Drive](https://drive.google.com/) にアクセス
2. 新規フォルダを作成（例：`ToranomonVT_FormUploads`）
3. フォルダを右クリック→「共有」→「共有設定」
4. 設定：
   - 「一般公開」ではなく「自分共有」のまま
   - GAS からアクセスするため、追加設定は不要

### ステップ 2: フォルダ ID の取得

1. 作成したフォルダを開く
2. URL を確認：`https://drive.google.com/drive/folders/1ABC123...xyz`
3. `folders/` 以降の部分がフォルダ ID
4. この ID を控えてください

---

## Google Apps Script の設定

### ステップ 1: Google フォームのスクリプトエディタを開く

1. Google フォームの編集画面を開く
2. 右上の「︙」（メニュー）→「スクリプトエディタ」を選択

### ステップ 2: 設定ファイルの作成

1. スクリプトエディタで「+」→「スクリプト」を選択
2. ファイル名を `config.gs` として保存
3. 以下のコードを貼り付け：

```javascript
// Firebase 設定
var FIREBASE_DB_URL = 'https://あなたのプロジェクト ID.firebaseio.com';
var FIREBASE_PROJECT_ID = 'あなたのプロジェクト ID';

// Google Drive 設定
var GOOGLE_DRIVE_FOLDER_ID = 'あなたのドライブフォルダ ID';
```

4. 各値を実際の値に置き換える

### ステップ 3: メインスクリプトの作成

1. 既存の `Code.gs` を開く
2. リポジトリの `code.gs` の内容をコピーして貼り付け
3. 保存（💾 アイコン）

### ステップ 4: appsscript.json の設定

1. スクリプトエディタで「+」→「スクリプト」を選択
2. ファイル名を `appsscript.json` として保存
3. リポジトリの `appsscript.json` の内容をコピーして貼り付け

---

## Google フォームの設定

### 必須項目（5 個）

以下の質問を必ず追加してください：

1. **あなたの名前をプルダウンから選択して下さい。**（プルダウン）
2. **名前（ひらがな）**（ショート テキスト）
3. **名前（ローマ字）**（ショート テキスト）
4. **Web に公開するヘッダー画像をアップして下さい。**（ファイルのアップロード）
5. **Web に公開する全身画像をアップして下さい。**（ファイルのアップロード）
6. **Web ページへの公開可否フラグ**（ラジオボタン）
   - オプション：`する`, `しない`

### 任意項目

以下の質問を追加（必要に応じて）：

- SNS リンク（ショートテキスト）
- 誕生日（日付）
- 初配信日（日付）
- 身長（ショートテキスト）
- イメージカラー（ショートテキスト）
- 推しマーク（ショートテキスト）
- 配信用語（チェックボックス）
- ユニット・プロジェクト名（ショートテキスト）
- イラストレーター（ショートテキスト）
- 2D モデラー（ショートテキスト）
- 3D モデラー（ショートテキスト）
- ファンネーム（ショートテキスト）
- 公式ハッシュタグ（ショートテキスト）
- 配信予定（ロングテキスト）
- オススメ動画（投稿済みの動画サイトの URL を記入。）（ショートテキスト）
- お知らせ・イベント予定（ロングテキスト）
- グッズ・音楽配信サイトリンク（ショートテキスト）
- ファンへ一言（ロングテキスト）
- Q＆A（ロングテキスト）
- 自己紹介ページで再生されるボイスをアップして下さい。（ファイルのアップロード・複数可）
- 自己紹介ページに動画を流したい場合はアップして下さい。（ファイルのアップロード）

### ファイルアップロードの設定

ファイルアップロード質問を追加する際：
1. 必須：回答者を「組織内」に制限（G Suite の場合）
2. または、一般公開フォルダに保存されることを許可

---

## トリガーの設定

### ステップ 1: トリガーの追加

1. スクリプトエディタの左メニューで「トリガー」（時計アイコン）をクリック
2. 「+ トリガーを追加」をクリック

### ステップ 2: トリガーの設定

以下の通り設定：

| 項目 | 設定値 |
|------|--------|
| 実行する関数 | `onFormSubmit` |
| 実行者 | `自分（あなたのメールアドレス）` |
| イベントのソース | `フォームから` |
| イベントの種類 | `フォーム送信時` |

### ステップ 3: 権限の承認

1. 「保存」をクリック
2. 権限の承認画面が表示される
3. アカウントを選択
4. 「詳細」→「（安全ではない）プロジェクト名」→「許可」を選択
5. 承認完了

---

## 動作確認

### ステップ 1: テスト送信

1. Google フォームのプレビューを表示
2. 必須項目をすべて入力
3. 送信

### ステップ 2: Firebase で確認

1. Firebase コンソール → Realtime Database →「データ」タブ
2. `form_submissions` ノードが作成されている
3. 送信データが JSON 形式で保存されていることを確認

### ステップ 3: エラーログの確認

1. スクリプトエディタの「実行情報」→「ログ」
2. エラーが発生している場合は、ログを確認

---

## トラブルシューティング

### フォーム送信がトリガーされない

- トリガーが正しく設定されているか確認
- 実行者が正しいか確認
- スクリプトのエラーログを確認

### Firebase にデータが保存されない

- `config.gs` の Firebase URL が正しいか確認
- Firebase のセキュリティルールを確認
- ネットワーク接続を確認

### ファイルアップロードが機能しない

- Google Drive のフォルダ ID が正しいか確認
- フォルダの共有設定を確認
- ファイルサイズ制限（15GB）を超過していないか確認

### indexOf でのマッチングが機能しない

- 質問文が正確に一致しているか確認
- 空白文字や改行が含まれていないか確認
- 日本語入力が正しいか確認

---

## 次のステップ

### Web サイト側でのデータ表示

1. Firebase からデータを取得する JavaScript を作成
2. メンバーページにデータを表示
3. 画像は Google Drive の共有リンクを使用

### セキュリティの強化

1. Firebase Security Rules を本番用に設定
2. 認証を有効化
3. API キーの管理を適切に実施

---

## トップページ用 Google フォームの設定

トップページ（`index.html`）のヒーローパネルとタイムラインは、別の Google フォームから Firebase の `top_submissions` ノードへ保存されたデータを使用します。

### Firebase セキュリティルール

トップページ用のノードに対するルールを追加してください：

```json
{
  "rules": {
    "top_submissions": {
      ".read": true,
      ".write": true,
      "$submissionId": {
        ".read": true,
        ".write": true
      }
    },
    "top_form_errors": {
      ".read": true,
      ".write": true
    }
  }
}
```

### トップページ用のフィールド定義

トップページ用フォームには、以下の質問を追加してください（`code_top.gs` の `FIELD_DEFINITIONS` に対応）：

#### ニュースセクション（ヒーパネル用）

| Firebase フィールド | 質問タイトル例 |
|---|---|
| `news1_genre` | ニュース１_ジャンル |
| `news1_headline` | ニュース１_見出し |
| `news1_content` | ニュース１_内容 |
| `news1_url` | ニュース１_URL |
| `news2_genre` | ニュース２_ジャンル |
| `news2_headline` | ニュース２_見出し |
| `news2_content` | ニュース２_内容 |
| `news2_url` | ニュース２_URL |
| `news3_genre` | ニュース３_ジャンル |
| `news3_headline` | ニュース３_見出し |
| `news3_content` | ニュース３_内容 |
| `news3_url` | ニュース３_URL |

#### 過去のイベント・実績セクション（タイムライン用）

| Firebase フィールド | 質問タイトル例 |
|---|---|
| `past_event1_date` | 過去のイベント、実績１_日付 |
| `past_event1_headline` | 過去のイベント、実績１_見出し |
| `past_event1_content` | 過去のイベント、実績１_内容 |
| `past_event1_url` | 過去のイベント、実績１_URL |
| `past_event2_date` | 過去のイベント、実績２_日付 |
| `past_event2_headline` | 過去のイベント、実績２_見出し |
| `past_event2_content` | 過去のイベント、実績２_内容 |
| `past_event2_url` | 過去のイベント、実績２_URL |
| `past_event3_date` | 過去のイベント、実績３_日付 |
| `past_event3_headline` | 過去のイベント、実績３_見出し |
| `past_event3_content` | 過去のイベント、実績３_内容 |
| `past_event3_url` | 過去のイベント、実績３_URL |

#### 画像・SNSセクション

| Firebase フィールド | 質問タイトル例 |
|---|---|
| `logo_image_1` 〜 `logo_image_5` | ロゴ画像アップロード１〜５ |
| `header_image_1` 〜 `header_image_5` | ヘッダ画像アップロード１〜５ |
| `normal_image_1` 〜 `normal_image_5` | 通常画像アップロード１〜５ |
| `email` | メール |
| `x_twitter` | X（旧ツイッター） |
| `tiktok` | TikTok |
| `youtube` | YouTube |
| `twitch` | Twitch |
| `discord_invite` | Discord招待リンク |

### トップページ用スクリプトの構成

トップページ用の Google Apps Script には、以下のファイルを使用してください：

- `config.gs` - Firebase 設定
- `code_top.gs` - メインスクリプト（`onFormSubmit`、`storeInFirebase` など）
- `appsscript.json` - マニフェスト

### トリガー設定

トップページ用フォームのトリガーも同様に設定してください：

| 項目 | 設定値 |
|------|--------|
| 実行する関数 | `onFormSubmit` |
| 実行者 | 自分 |
| イベントのソース | フォームから |
| イベントの種類 | フォーム送信時 |

### 動作確認

1. トップページ用フォームを送信
2. Firebase コンソール → Realtime Database → `top_submissions` ノードが作成されていることを確認
3. Web サイトのヒーローパネルとタイムラインにデータが反映されていることを確認

---

## サポート

問題が発生した場合は：
1. エラーログを確認
2. Firebase コンソールのログを確認
3. Google Apps Script の実行情報を確認
