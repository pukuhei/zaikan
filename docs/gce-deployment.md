# Google Compute Engine (GCE) デプロイガイド

このガイドでは、Google Compute Engine 上で「ざいかん！」を常時稼働させる手順を説明します。

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

### 8. 動作確認

1. VM インスタンスの外部 IP アドレスを確認
2. ブラウザで `http://[外部IPアドレス]:3001` にアクセス
3. 「ざいかん！」アプリが表示されることを確認

### 9. 予算アラート設定（重要）

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

## 💰 想定コスト

| 項目                             | 月額料金        |
| -------------------------------- | --------------- |
| e2-micro インスタンス (744 時間) | 無料枠          |
| 標準永続ディスク (10GB)          | $0.40           |
| 外部 IP (エフェメラル)           | 無料            |
| ネットワーク使用料 (〜1GB)       | $0.12           |
| **合計**                         | **約 $0.52/月** |

## ⚠️ 注意事項

1. **無料枠の制限**: e2-micro インスタンスは月 744 時間（31 日 ×24 時間）まで無料
2. **予算管理**: 予算アラートを必ず設定してください
3. **データ永続化**: VM インスタンスを削除するとデータが消失します
4. **セキュリティ**: 本番環境では適切なファイアウォール設定を行ってください

## 🚨 トラブルシューティング

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
```

### メモリ不足

```bash
# メモリ使用量確認
free -h

# 不要なプロセス停止
sudo systemctl disable snapd
```

## 📞 サポート

このドキュメントで解決しない問題があれば、GitHub の Issue で報告してください。
