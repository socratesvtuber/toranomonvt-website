# Cloudflare Pages 詳細設定ガイド - 完全版

このガイドでは、Cloudflare Pages Functions を使用して Firebase 設定を環境変数で管理する**具体的な手順**を、実際の値の例を交えて説明します。

---

## ステップ 1: Firebase プロジェクトの作成と設定値の取得

### 1.1 Firebase プロジェクトを作成

1. [Firebase コンソール](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `toranomon-vt`）
4. Google アナリティクスは任意で有効化（今回はデフォルトで OK）
5. 「プロジェクトを作成」をクリック

### 1.2 Firebase 設定値を取得

1. Firebase コンソールで、左上の**歯車アイコン⚙️**（プロジェクト設定）をクリック
2. 「プロジェクトの設定」を選択
3. 画面を下にスクロールし、「マイアプリ」セクションへ
4. Web アイコン（`</>`）をクリック
5. アプリ名を入力（例: `toranomon-website`）
6. 「Firebase SDK」の構成に以下の値が表示されます：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "toranomon-vt.firebaseapp.com",
  projectId: "toranomon-vt",
  storageBucket: "toranomon-vt.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**これらの値をすべてメモしてください。**

### 1.3 Firestore データベースを作成

1. Firebase コンソールの左メニューで「Firestore データベース」をクリック
2. 「データベースを作成」をクリック
3. **テストモード**を選択（後でセキュリティルールを設定）
4. ロケーションを選択: `asia-northeast1（東京）`
5. 「有効」をクリック

### 1.4 Firestore セキュリティルールを設定

1. Firestore データベースページで「ルール」タブをクリック
2. 以下のルールに書き換えて「公開」をクリック：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /counters/{counterId} {
      allow read, write: if true;
    }
  }
}
```

---

## ステップ 2: Cloudflare Pages の設定

### 2.1 Cloudflare Pages プロジェクトを作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューから「Pages」を選択
3. 「Connect to Git」をクリック
4. GitHub または GitLab のアカウントで認証
5. このプロジェクトのリポジトリを選択（例: `toranomonvt-website`）
6. 「Begin setup」をクリック

### 2.2 ビルド設定

以下のように入力：

| 項目 | 値 |
|------|-----|
| Project name | `toranomon-vt`（任意） |
| Production branch | `main`（または `master`） |
| Build command | `npm run build` |
| Build output directory | `./`（空欄のまま） |

### 2.3 環境変数を設定（重要）

1. 「Save and Deploy」をクリック（または「Save only」）
2. プロジェクトページで「設定」→「環境変数」を選択
3. 「環境変数を追加」をクリック
4. 以下の 6 つの変数を**1 つずつ**追加：

| 変数名 | 値（Firebase から取得した実際の値） | 説明 |
|--------|-----------------------------------|------|
| `FIREBASE_API_KEY` | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` | Firebase API キー |
| `FIREBASE_AUTH_DOMAIN` | `toranomon-vt.firebaseapp.com` | 認証ドメイン |
| `FIREBASE_PROJECT_ID` | `toranomon-vt` | プロジェクト ID |
| `FIREBASE_STORAGE_BUCKET` | `toranomon-vt.appspot.com` | ストレージバケット |
| `FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | 送信元 ID |
| `FIREBASE_APP_ID` | `1:123456789012:web:abcdef123456` | アプリ ID |

**注意**: 実際の値は Firebase コンソールで取得した値に置き換えてください。

### 2.4 デプロイ

1. Cloudflare Pages の「デプロイ」ページへ移動
2. 最新のデプロイを選択
3. 「デプロイの再実行」をクリック（環境変数が反映されます）

---

## ステップ 3: 動作確認

### 3.1 サイトにアクセス

Cloudflare Pages で表示されている URL（例: `https://toranomon-vt.pages.dev`）にアクセス

### 3.2 ブラウザのコンソールを確認

1. ブラウザで F12 キーを押して開発者ツールを開く
2. 「Console」タブを選択
3. 以下のメッセージが表示されていれば成功です：

```
🔧 Environment loaded: {firebaseConfigured: true}
✅ Firebase initialized successfully
```

### 3.3 マイルストーンカウンターを確認

1. トップページにアクセス
2. カウンターがインクリメントされていることを確認
3. Firebase コンソールの「Firestore データベース」でデータが作成されていることを確認：
   - コレクション: `counters`
   - ドキュメント: `visitor_count`
   - フィールド: `count`（訪問者数）

---

## ファイルの仕組み

### `functions/api/firebase-config.js`

Cloudflare Pages Functions が環境変数から Firebase 設定を返します：

```javascript
export async function onRequest(context) {
  const { env } = context;
  
  const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID
  };
  
  return new Response(JSON.stringify(firebaseConfig), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### `firebase-config.js`

クライアント側が API から設定を取得：

```javascript
async fetchConfig() {
  const response = await fetch('/api/firebase-config');
  this.config = await response.json();
  return this.config;
}
```

---

## トラブルシューティング

| 問題 | 解決策 |
|------|--------|
| `Firebase config not available` と表示 | 環境変数が正しく設定されているか確認 |
| `/api/firebase-config` が 404 | `functions/api/firebase-config.js` がデプロイされているか確認 |
| カウンターが動かない | Firestore のセキュリティルールを確認 |
| CORS エラー | Cloudflare Functions は自動的に CORS を処理します |

---

## 次のステップ

1. 上記の手順で設定
2. 問題があればエラーメッセージを通知
3. 本番環境ではセキュリティルールを強化

ご不明な点がございましたら、どの手順でつまずいているかお知らせください。
