# Firebase 設定ガイド - 共通ミリ秒カウンター用

このガイドでは、全ユーザーで共有される訪問者カウンターに Firebase を使用する設定方法を説明します。

## 概要

この Web サイトでは Firebase Firestore を使用して、全ユーザーで共有される訪問者カウンターを実装しています。Firebase が設定されていない場合は、ローカルストレージ（ユーザーごと）にフェルバックします。

## ステップ 1: Firebase プロジェクトの作成

1. [Firebase コンソール](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例："toranomon-vt"）
4. ウィザードに従って設定：
   - Google アナリティクスを有効化（任意）
   - 利用規約に同意
5. 「プロジェクトを作成」をクリック

## ステップ 2: Firestore データベースの作成

1. Firebase コンソールの左サイドバーで「Firestore Database」をクリック
2. 「データベースを作成」をクリック
3. **プロダクションモード** または **テストモード** を選択（開発中はテストモードで問題ありません）
4. ロケーションを選択（日本からのアクセスがメインの場合は「asia-northeast1（東京）」を推奨）
5. 「有効」をクリック

## ステップ 3: Firebase 設定情報の取得

1. Firebase コンソールで、プロジェクト概要の横にある歯車アイコン ⚙️ をクリック
2. 「プロジェクトの設定」を選択
3. 「マイアプリ」セクションまでスクロール
4. Web アイコングル `</>` をクリックして Web アプリを追加
5. アプリ名を入力（例："toranomon-website"）
6. 表示された `firebaseConfig` オブジェクトの値をコピー

## ステップ 4: firebase-config.js の設定

`firebase-config.js` ファイルを開き、以下の値を実際のものに書き換えてください：

```javascript
config: {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // ← あなたの API キー
  authDomain: "toranomon-vt.firebaseapp.com", // ← あなたのプロジェクト ID
  projectId: "toranomon-vt", // ← あなたのプロジェクト ID
  storageBucket: "toranomon-vt.appspot.com",
  messagingSenderId: "123456789012", // ← あなたの送信者 ID
  appId: "1:123456789012:web:abcdef123456" // ← あなたのアプリ ID
}
```

**重要な注意：**
- 静的な Web サイトでは `.env` ファイルから自動的に設定値を読み込むことができません
- `firebase-config.js` を直接編集して、実際の Firebase 設定値を記述してください
- `.env.example` はテンプレートとして用意しています。必要に応じて `.env` としてコピーし、設定値を控えるためにお使いください

## ステップ 5: Firestore セキュリティルール設定

Firebase コンソールで「Firestore Database」→「ルール」タブに移動し、以下を設定：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // counters コレクションへの読み取り/書き込みを許可
    match /counters/{counterId} {
      allow read, write: if true; // 開発用。本番環境では制限を強化してください
    }
  }
}
```

**注意：** 本番環境では、より厳格なセキュリティルールを設定することをお勧めします。

## ステップ 6: 動作確認

1. Web サイトをブラウザで開く
2. トップページにアクセス - カウンターがインクリメントされるはずです
3. ブラウザのコンソール（F12）でエラーが出ていないか確認
4. Firebase コンソール → Firestore データベースでカウンタードキュメントを確認

## トラブルシューティング

### カウンターがインクリメントされない
- ブラウザのコンソールでエラーを確認
- Firebase の設定値が正しいか確認
- Firestore がプロジェクトで有効になっているか確認

### 「Firebase initialization failed」というメッセージ
- Firebase の設定が正しくない場合に表示されます
- ローカルストレージにフェルバックします
- `firebase-config.js` の設定値を再確認

### Permission denied エラー
- Firestore のセキュリティルールを確認
- `counters` コレクションへの読み取り/書き込みが許可されているか確認

## 料金について

Firebase には無料枠があります：
- 1 日 50,000 回の読み取り
- 1 日 20,000 回の書き込み
- 1 GB のストレージ

通常の Web サイトであれば、これで十分です。Firebase コンソールで使用状況を確認できます。

## 本番環境での推奨事項

1. **セキュリティルールを制限** - 特定の操作のみ許可
2. **Firebase App Check の有効化** - 不正利用を防止
3. **請求アラートの設定** - 使用状況を監視
4. **レート制限の検討** - カウンターエンドポイントの保護

## 代替手段

Firebase を使用したくない場合は、以下が代替手段です：
- Supabase（オープンソースの Firebase 代替）
- Node.js/Python バックエンドとデータベース
- サーバーレス関数（AWS Lambda、Cloud Functions）

コードは Firebase が利用できない場合、ローカルストレージにフェルバックするように設計されています。
