# デプロイメントガイド

## Vercel でのデプロイ

### 1. 前提条件
- GitHubアカウント
- Vercelアカウント

### 2. デプロイ手順

1. **リポジトリをGitHubにプッシュ**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Vercelでプロジェクトをインポート**
   - [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
   - "New Project"をクリック
   - GitHubリポジトリを選択
   - 設定はデフォルトのまま（`vercel.json`が自動的に読み込まれます）

3. **環境変数の設定**（必要に応じて）
   - Vercel Dashboardで "Settings" > "Environment Variables"
   - 必要な環境変数があれば追加

### 3. 個人利用のフォーク手順

1. **このリポジトリをフォーク**
2. **フォークしたリポジトリをクローン**
   ```bash
   git clone <your-forked-repo-url>
   cd zaikan
   ```

3. **依存関係をインストール**
   ```bash
   npm run install:all
   ```

4. **ローカルで開発サーバーを起動**
   ```bash
   npm run dev
   ```

5. **Vercelにデプロイ**
   - 上記のVercelデプロイ手順に従う

## Railway でのデプロイ

### 1. Railway でのデプロイ手順

1. [Railway](https://railway.app/) にアクセス
2. "Deploy from GitHub repo" を選択
3. リポジトリを接続
4. 自動的にビルドとデプロイが開始

### 2. 環境変数
- `PORT`: Railwayが自動設定
- `NODE_ENV`: `production`

## ローカル開発

### 開発サーバーの起動
```bash
# すべての依存関係をインストール
npm run install:all

# フロントエンドとバックエンドを同時に起動
npm run dev
```

### 個別に起動する場合
```bash
# バックエンドのみ
cd backend && npm run dev

# フロントエンドのみ
cd frontend && npm run dev
```

### 本番ビルド
```bash
npm run build
```

## データベース

- SQLiteファイルは `database/zaikan.db` に作成されます
- 初回起動時に自動的にテーブルが作成されます
- 本番環境では永続的なストレージの設定が必要です

## 注意事項

1. **SQLiteの制限**: 複数の同時アクセスには制限があります
2. **ファイルストレージ**: Vercelの場合、ファイルは一時的なため永続化されません
3. **スケーラビリティ**: 大規模な利用には適していません

## トラブルシューティング

### よくある問題

1. **依存関係のエラー**
   ```bash
   rm -rf node_modules backend/node_modules frontend/node_modules
   npm run install:all
   ```

2. **ポートの競合**
   - バックエンド: `PORT=3001 npm run backend:dev`
   - フロントエンド: `PORT=5174 npm run frontend:dev`

3. **TypeScriptエラー**
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run type-check
   ```