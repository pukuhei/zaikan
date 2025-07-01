# GCP HTTP環境での混合コンテンツエラー解決手順

## 問題の概要
HTTP環境でHTTPSアセットの読み込みエラーが発生していたため、コスト効率を重視してHTTP専用の設定に修正しました。

## 修正内容

### 1. Vite設定の修正 ✅
- 相対パス（`./`）でのアセット読み込みに変更
- HTTP/HTTPS混合コンテンツエラーの回避

### 2. Express.js設定の調整 ✅
- セキュリティヘッダーをHTTP環境用に調整
- Cross-Origin-Opener-PolicyとOrigin-Agent-Clusterヘッダーを無効化

### 3. フロントエンド再ビルド ✅
- HTTP環境用の設定でビルド済み
- すべてのアセットが相対パスで参照

## GCPサーバーでの適用手順

### 即座に解決（推奨）

```bash
# 1. 修正されたファイルをGCPサーバーにアップロード
cd /path/to/zaikan

# 2. バックエンドの再起動
cd backend
npm install  # 念のため依存関係を再インストール
npm run build
npm start    # または pm2 restart zaikan

# 3. ブラウザでアクセステスト
# http://34.29.0.78:3001/
```

### オプション: Nginx設定（ポート80対応）

```bash
# 1. Nginxのインストール
sudo apt update
sudo apt install nginx

# 2. 設定ファイルのコピー
sudo cp nginx-zaikan.conf /etc/nginx/sites-available/zaikan

# 3. サイトの有効化
sudo ln -s /etc/nginx/sites-available/zaikan /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 4. 設定テスト
sudo nginx -t

# 5. Nginxの再起動
sudo systemctl reload nginx

# 6. ポート80でのアクセステスト
# http://34.29.0.78/
```

## 期待される結果

✅ **アセット読み込みエラーの解消**
- CSSファイルの正常読み込み
- JavaScriptファイルの正常読み込み
- 画像・アイコンの正常読み込み

✅ **セキュリティ警告の解消**
- Cross-Origin-Opener-Policy警告の解消
- Origin-Agent-Cluster警告の解消

✅ **完全なHTTP動作**
- すべての機能が HTTP環境で正常動作
- 混合コンテンツエラーなし

## コスト
- **追加費用**: ¥0
- **作業時間**: 10-15分

## 将来の拡張（任意）

### SSL化（独自ドメイン使用時）
```bash
# Cloudflare無料プラン または Let's Encrypt
# 年間コスト: ドメイン代のみ（~¥1,000）
```

## トラブルシューティング

### ファイルが見つからない場合
```bash
# distフォルダの確認
ls -la /path/to/zaikan/frontend/dist/

# アセットファイルの確認
ls -la /path/to/zaikan/frontend/dist/assets/
```

### Nginxエラーの場合
```bash
# ログの確認
sudo tail -f /var/log/nginx/error.log

# 設定テスト
sudo nginx -t
```

---

**注意**: この設定はHTTP環境に最適化されています。将来SSL化する場合は、一部設定を再調整する必要があります。