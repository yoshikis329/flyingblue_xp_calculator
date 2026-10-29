# flyingblue_xp_calculator
2地点の距離と航空券の金額を入力するとFlyingBlueのXPを計算するツール
https://yoshikis329.github.io/flyingblue_xp_calculator/

距離カテゴリの取得にはFlying BlueのAPIを使用します。ブラウザーから直接アクセスできないため、Cloudflare Workerを中継先として利用します。同じ区間の取得結果はブラウザー内に12時間キャッシュします。

## Cloudflare Workerのセットアップ

1. Cloudflareアカウントでログインできる環境にWranglerを用意します。
2. リポジトリのルートで `npx wrangler deploy worker.js --name flyingblue-xp-api` を実行し、Workerをデプロイします。
3. サイトを再デプロイします。

Workerはこのサイトのオリジンからのリクエストだけを許可し、Flying Blueの固定APIだけに接続します。公開プロキシの停止やレート制限を回避できますが、Flying Blue側で障害やアクセス制限が発生した場合は計算できません。
