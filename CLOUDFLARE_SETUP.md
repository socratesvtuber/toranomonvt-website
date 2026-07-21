# Cloudflare Pages 環境変数設定ガイド

このガイドでは、Cloudflare Pages の環境変数と Functions を使用して Firebase 設定を安全に管理する方法を説明します。

## 概要

このプロジェクトでは、Cloudflare Pages Functions を使用して Firebase の設定情報を環境変数から取得します。これにより、機密情報をコードから分離し、環境ごとに異なる設定を使用できます。

## アーキテクチャ

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Client-side   │────>│  /api/firebase-config │────>│  Environment    │
│   (firebase-    │     │  (Pages Functions)   │     │  Variables      │
│   config.js)    │     │                      │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

## ステップ 1: Cloudflare Pages プロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューから「Pages」を選択
3. 「Connect to Git」をクリック
4. GitHub/GitLab リポジトリを選択（このプロジェクトのリポジトリ）
5. 「Begin setup」をクリック

## ステップ 2: ビルド設定

1. **Project name**: `toranomon-vt`（任意）
2. **Production branch**: `main`（または `master`）
3. **Build command**: `npm run build`
4. **Build output directory**: `./`（空のまま）

## ステップ 3: 環境変数の設定

1. Cloudflare Pages ダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment variables」を選択
3. 「Add variable」をクリック
4. 以下の環境変数を追加：

| Variable name | Value (例) | Description |
|--------------|-----------|-------------|
| `FIREBASE_API_KEY` | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` | Firebase API キー |
| `FIREBASE_AUTH_DOMAIN` | `toranomon-vt.firebaseapp.com` | 認証ドメイン |
| `FIREBASE_PROJECT_ID` | `toranomon-vt` | プロジェクト ID |
| `FIREBASE_STORAGE_BUCKET` | `toranomon-vt.appspot.com` | ストレージバケット |
| `FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | メッセージング送信元 ID |
| `FIREBASE_APP_ID` | `1:123456789012:web:abcdef123456` | アプリ ID |

**重要**: 実際の値は Firebase コンソールで取得してください。

## ステップ 4: Firebase プロジェクトの設定

1. [Firebase コンソール](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Firestore データベース」を選択
4. データベースが作成されていない場合は「データベースを作成」を選択
5. セキュリティルールを以下のように設定：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /counters/{counterId} {
      allow read, write: if true;
    }
  }
}
```

## ステップ 5: デプロイ

設定が完了したら、変更をプッシュしてデプロイします：

```bash
git add .
git commit -m "Update for Cloudflare Pages"
git push origin main
```

Cloudflare Pages が自動的にビルドとデプロイを実行します。

## ステップ 6: 動作確認

1. デプロイが完了したら、サイトにアクセス
2. ブラウザの開発者ツール（F12）を開く
3. コンソールに「✅ Firebase initialized successfully」と表示されていれば成功
4. マイルストーンカウンターが正常に動作しているか確認

## ローカル開発

ローカルで開発する場合は、`.env` ファイルを使用します：

```bash
# .env.example をコピー
cp .env.example .env

# .env ファイルを編集して実際の値を設定
```

ローカルサーバーを実行：

```bash
npm install
npm run dev
```

## トラブルシューティング

### "Firebase config not available" エラー

1. Cloudflare Dashboard で環境変数が正しく設定されているか確認
2. 環境変数の値が空でないか確認
3. デプロイログでエラーが出ていないか確認

### カウンターがインクリメントされない

1. ブラウザのコンソールでエラーを確認
2. Firestore データベースが作成されているか確認
3. セキュリティルールが正しく設定されているか確認

### 404 エラー（/api/firebase-config）

1. `functions/api/firebase-config.js` がデプロイされているか確認
2. Cloudflare Pages Functions が有効になっているか確認

## セキュリティ上の注意

- Firestore のセキュリティルールは必要に応じて制限を強化
- 本番環境では Firebase App Check の使用を推奨
- 環境変数は Cloudflare Dashboard でのみ管理

## ファイル構成

```
toranomonvt-website/
├── functions/
│   └── api/
│       └── firebase-config.js    # Firebase 設定を返す API
├── firebase-config.js             # Firebase 設定とカウンター管理
├── env-loader.js                  # 環境変数読み込み
├── index.html                     # メインページ
├── .env.example                   # 環境変数のテンプレート
└── CLOUDFLARE_SETUP.md            # このファイル
```

## 参考リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Firebase コンソール](https://console.firebase.google.com/)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
