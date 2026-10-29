# flyingblue_xp_calculator
2地点の距離と航空券の金額を入力するとFlyingBlueのXPを計算するツール
https://yoshikis329.github.io/flyingblue_xp_calculator/

距離カテゴリの取得にはFlying BlueのAPIを使用します。ブラウザーから直接アクセスできないため、Cloudflare Workerを中継先として利用します。同じ区間の取得結果はブラウザー内に12時間キャッシュします。

## Cloudflare Workerのセットアップ

1. Cloudflareアカウントでログインできる環境にWranglerを用意します。
2. リポジトリのルートで `npx wrangler deploy` を実行し、Workerをデプロイします。以後 `worker.js` を変更した場合も、このコマンドでWorkerを再デプロイしてください。
3. `script.js` を変更した場合のみ、サイトを再デプロイします。

Workerはこのサイトのオリジンからのリクエストだけを許可し、Flying Blueの固定APIだけに接続します。接続時にはブラウザー相当の `Origin` と `Referer` を含めます。公開プロキシの停止やレート制限を回避できますが、Flying Blue側で障害やアクセス制限が発生した場合は計算できません。Workerを変更しただけでは公開中のWorkerは変わらないため、必ず再デプロイしてください。
