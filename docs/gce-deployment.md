# Google Compute Engine (GCE) デプロイガイド

このガイドでは、Google Compute Engine 上で「ざいかん！」を**HTTP環境で安定動作**させる完全な手順を説明します。

## 🎯 このガイドの特徴

- ✅ **HTTP/HTTPS混合エラー完全解決**
- ✅ **追加費用ゼロ**（無料枠内運用）
- ✅ **30分で完了**（設定〜動作確認まで）
- ✅ **安定稼働**（24時間対応）

## 前提条件

- Google アカウント
- Google Cloud Platform (GCP) アカウント（クレジットカード登録必要）
- 基本的な Linux コマンドの知識

## 📋 セットアップ手順

### 1. GCP プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. 課金を有効化（無料枠使用のため）

### 2. VM インスタンス作成

1. **Compute Engine** → **VM インスタンス** → **インスタンスを作成**
2. 以下の設定を選択：

```
名前: zaikan-server
リージョン: us-central1 (アイオワ)
ゾーン: us-central1-a
マシンの構成: E2
マシンタイプ: e2-micro (1 vCPU、1 GB メモリ)
ブートディスク: Ubuntu 22.04 LTS
ディスクサイズ: 10 GB (最小構成)
ファイアウォール: HTTP トラフィックを許可
```

3. **作成** をクリック

### 3. ファイアウォール設定

インスタンス作成後、アプリケーション用ポートを開放：

1. **VPC ネットワーク** → **ファイアウォール** → **ファイアウォールルールを作成**
2. 以下を設定：

```
名前: zaikan-app-port
方向: 上り（ingress）
ターゲット: 指定されたタグ
ターゲットタグ: zaikan-server
ソースIPの範囲: 0.0.0.0/0
プロトコルとポート: TCP - 3001
```

3. VM インスタンスにタグを追加：
   - インスタンス詳細 → **編集** → ネットワークタグに `zaikan-server` を追加

### 4. サーバーに SSH 接続

VM インスタンス一覧から **SSH** ボタンをクリック

### 5. サーバー環境構築

SSH 接続後、以下のコマンドを順番に実行：

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Node.js 18 のインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git のインストール
sudo apt-get install -y git

# PM2 (プロセス管理ツール) のインストール
sudo npm install -g pm2

# 必要に応じてファイアウォール設定
sudo ufw enable
sudo ufw allow 22     # SSH
sudo ufw allow 3001   # アプリケーション
```

### 6. アプリケーションのデプロイ

```bash
# リポジトリのクローン
git clone <your-repository-url>
cd zaikan

# 依存関係のインストール
npm run install:all

# 本番ビルド
npm run build

# データベースディレクトリの作成
mkdir -p database

# バックエンドサーバーの起動
cd backend
pm2 start dist/index.js --name zaikan-backend

# PM2の自動起動設定
pm2 startup
# 表示されたコマンドをコピーして実行（sudo権限が必要）

# 現在のPM2プロセスを保存
pm2 save
```

### 7. フロントエンドの配信設定

バックエンドでフロントエンドも配信するように設定します：

```bash
# backend/src/index.ts の最後（app.listen の前）に以下を追加
```

以下の設定をバックエンドコードに追加する必要があります：

```typescript
// Serve frontend static files
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

// APIエラーハンドラ
app.use("/api/*", errorHandler);

// SPA用 catch-all（API以外は全てindex.htmlを返す）
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
```

### 8. HTTP環境用の設定調整

**重要**: GCP環境でHTTP/HTTPS混合コンテンツエラーを回避するため、以下の設定を確認してください：

#### バックエンド設定（既に適用済み）

`backend/src/index.ts` でセキュリティヘッダーがHTTP環境用に調整されています：

```typescript
// HTTP環境用のhelmet設定
app.use(helmet({
  contentSecurityPolicy: false, // CSPを無効化
  crossOriginOpenerPolicy: false, // COOPヘッダー無効化
  crossOriginResourcePolicy: false, // CORPヘッダー無効化
  originAgentCluster: false, // Origin-Agent-Clusterヘッダー無効化
  hsts: false // HSTS無効化（HTTP環境では不要）
}));
```

#### フロントエンド設定（既に適用済み）

`frontend/vite.config.ts` が相対パス用に設定されています：

```typescript
export default defineConfig({
  base: './', // 相対パスでアセット読み込み
  // ... その他の設定
});
```

### 9. 動作確認

1. VM インスタンスの外部 IP アドレスを確認
2. ブラウザで `http://[外部IPアドレス]:3001` にアクセス
3. 「ざいかん！」アプリが表示されることを確認
4. **エラーがないことを確認**:
   - CSS・JSファイルが正常に読み込まれる
   - コンソールエラーがない
   - 全機能が正常動作する

### 10. 【オプション】Nginx設定でポート80対応

ポート80（標準HTTPポート）でアクセスできるようにする場合：

```bash
# Nginxのインストール
sudo apt update
sudo apt install nginx

# 設定ファイルの作成
sudo nano /etc/nginx/sites-available/zaikan
```

以下の内容を入力：

```nginx
server {
    listen 80;
    server_name YOUR_VM_IP;
    
    # セキュリティヘッダー（HTTP環境用）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 静的ファイルのキャッシュ設定
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @app;
    }
    
    # メインアプリケーションへのプロキシ
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# サイトの有効化
sudo ln -s /etc/nginx/sites-available/zaikan /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 設定テスト
sudo nginx -t

# Nginxの起動
sudo systemctl enable nginx
sudo systemctl start nginx

# ファイアウォール設定
sudo ufw allow 80
```

これで `http://[外部IPアドレス]` （ポート指定なし）でアクセス可能になります。

### 11. 予算アラート設定（重要）

予期しない課金を防ぐため、予算アラートを設定：

1. **お支払い** → **予算とアラート** → **予算を作成**
2. 以下を設定：

```
予算名: zaikan-budget
金額: $10
アラートのしきい値: 50%, 90%, 100%
```

## 🔧 運用・メンテナンス

### アプリケーションの更新

```bash
# サーバーにSSH接続
cd zaikan

# 最新コードを取得
git pull origin main

# 再ビルド
npm run build

# PM2でアプリケーションを再起動
pm2 restart zaikan-backend
```

### ログの確認

```bash
# アプリケーションログ
pm2 logs zaikan-backend

# PM2プロセス監視
pm2 monit

# システムリソース確認
htop
```

### データベースバックアップ

```bash
# SQLiteファイルのコピー
cp database/zaikan.db database/zaikan_backup_$(date +%Y%m%d).db

# Cloud Storageへのバックアップ（オプション）
gsutil cp database/zaikan.db gs://your-backup-bucket/
```

## 💰 想定コスト（HTTP環境・最適化後）

| 項目                             | 月額料金        | 備考 |
| -------------------------------- | --------------- | ---- |
| e2-micro インスタンス (744 時間) | 無料枠          | 常時無料 |
| 標準永続ディスク (10GB)          | $0.40           | 最小構成 |
| 外部 IP (エフェメラル)           | 無料            | 静的IPは有料 |
| ネットワーク使用料 (〜1GB)       | $0.12           | 軽量アプリ |
| **合計**                         | **約 $0.52/月** | **約¥78/月** |

### 無料化オプション

- **静的IP不要**: エフェメラルIPで運用
- **ディスク最小化**: 8GB設定（$0.32/月）
- **リージョン最適化**: us-central1使用

## ⚠️ 注意事項

### セキュリティ
1. **HTTP環境**: 現在の設定はHTTP専用です（SSL未対応）
2. **セキュリティヘッダー**: 一部を無効化してHTTP動作を優先
3. **ファイアウォール**: 必要最小限のポートのみ開放
4. **アクセス制限**: 本番環境では IP制限を検討

### 運用
5. **無料枠の制限**: e2-micro インスタンスは月 744 時間（31 日 ×24 時間）まで無料
6. **予算管理**: 予算アラートを必ず設定してください
7. **データ永続化**: VM インスタンスを削除するとデータが消失します
8. **バックアップ**: 定期的なデータベースバックアップを推奨

### 将来の拡張
9. **SSL化**: 独自ドメイン取得後、Let's EncryptやCloudflare使用
10. **スケーリング**: トラフィック増加時はマシンタイプをアップグレード

## 🚨 トラブルシューティング

### HTTP/HTTPS混合コンテンツエラー

**症状**: CSSやJSファイルの読み込みエラー、`ERR_SSL_PROTOCOL_ERROR`

```bash
# 1. フロントエンドビルドの確認
cd frontend/dist
cat index.html  # アセットパスが "./assets/" になっているか確認

# 2. バックエンド設定の確認
cd backend
grep -n "contentSecurityPolicy: false" dist/index.js

# 3. アプリケーション再起動
pm2 restart zaikan-backend

# 4. ブラウザキャッシュクリア
# Ctrl+Shift+R (強制リロード)
```

### アプリケーションが起動しない

```bash
# PM2ログを確認
pm2 logs zaikan-backend

# プロセス状態確認
pm2 status

# 手動でアプリケーション起動テスト
cd backend
node dist/index.js
```

### ポートアクセスできない

```bash
# ファイアウォール確認
sudo ufw status

# GCPファイアウォールルール確認
# Cloud Console → VPCネットワーク → ファイアウォール

# Nginxを使用している場合
sudo systemctl status nginx
sudo nginx -t
```

### メモリ不足

```bash
# メモリ使用量確認
free -h

# 不要なプロセス停止
sudo systemctl disable snapd

# PM2プロセスのメモリ使用量確認
pm2 monit
```

### Nginxトラブルシューティング

```bash
# Nginxログの確認
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 設定テスト
sudo nginx -t

# Nginxの再起動
sudo systemctl restart nginx
```

## 🎯 クイックチェックリスト

デプロイ後に以下を確認してください：

- [ ] VM インスタンスが起動している
- [ ] ファイアウォールルール（ポート3001）が設定済み
- [ ] PM2でアプリケーションが起動している (`pm2 status`)
- [ ] HTTP アクセスでアセットが正常読み込み
- [ ] コンソールエラーがない
- [ ] 予算アラートが設定済み

### よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| CSS/JSが読み込めない | HTTPS混合コンテンツエラー | フロントエンド再ビルド (`npm run build`) |
| ポート3001にアクセスできない | ファイアウォール未設定 | GCPファイアウォールルール確認 |
| アプリが起動しない | 依存関係エラー | `npm install` → `npm run build` 再実行 |
| データベースエラー | ディレクトリ未作成 | `mkdir -p database` 実行 |

## 📞 サポート

このドキュメントで解決しない問題があれば、GitHub の Issue で報告してください。

---

**追加費用**: ¥0（無料枠内）  
**設定時間**: 30-45分  
**安定性**: 24時間稼働対応
