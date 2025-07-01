# 在庫管理システム (Zaikan - Inventory Management System)

製造業向けの部品・商品・製造・売上・発注・在庫管理を一元化する Web アプリケーションです。

---

## 主な機能

- **ダッシュボード**：在庫状況・売上・製造・アラートの集約表示
- **部品管理**：部品の在庫・発注・入荷・最小在庫アラート
- **商品管理**：商品在庫・販売・製造レシピ設定・製造可能数計算
- **製造管理**：製造記録・製造可能数・カレンダー表示
- **売上管理**：売上記録・統計・商品別集計
- **発注管理**：部品発注・納入予定・発注状況管理

---

## 技術スタック

- **バックエンド**: Node.js (Express.js, TypeScript, SQLite)
- **フロントエンド**: Vue.js 3, Vite, TypeScript, Tailwind CSS
- **データベース**: SQLite (ファイルベース)

---

## 画面一覧

- **ダッシュボード**：在庫・売上・製造・アラート・カレンダー
- **部品管理**：部品一覧、在庫・発注・入荷・編集・削除
- **商品管理**：商品一覧、レシピ設定、製造・販売・編集・削除
- **製造管理**：製造記録一覧、製造可能数、カレンダー
- **売上管理**：売上記録、統計、商品別集計
- **発注管理**：発注一覧、納入予定、発注状況更新

---

## API 概要（主なエンドポイント）

- `/api/parts`：部品一覧・詳細・作成・更新・削除・在庫不足取得
- `/api/parts/:id/stock-entry`：部品の入荷記録
- `/api/parts/:id/order`：部品の発注
- `/api/partOrders`：発注一覧・詳細・状態更新
- `/api/partOrders/calendar/:year/:month`：納入予定カレンダー
- `/api/products`：商品一覧・詳細・作成・更新・削除
- `/api/products/:id/recipe`：商品レシピ取得・設定
- `/api/products/:id/manufacture`：商品製造
- `/api/products/:id/sell`：商品販売
- `/api/manufacturing/records`：製造記録一覧
- `/api/manufacturing/capacity/:productId`：製造可能数取得
- `/api/manufacturing/calendar/:year/:month`：製造カレンダー
- `/api/sales`：売上記録一覧・集計
- `/api/sales/summary`：売上サマリー
- `/api/sales/by-product`：商品別売上集計
- `/api/sales/trend`：月別売上トレンド
- `/api/stockEntries`：入荷記録一覧

---

## クイックスタート

### 1. リポジトリをクローン

```bash
git clone <your-forked-repo-url>
cd zaikan
```

### 2. 依存関係のインストール

```bash
npm run install:all
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

- フロントエンド: http://localhost:5173
- バックエンド API: http://localhost:3001

### 4. 本番ビルド

```bash
npm run build
```

---

## デプロイ
- [Google Compute Engine デプロイ手順](docs/gce-deployment.md)

---

## 使い方の流れ

1. **部品登録**：「部品管理」で部品を登録・在庫数/最小在庫数を設定
2. **商品登録**：「商品管理」で商品を登録・レシピ（必要部品）を設定
3. **在庫入荷**：「部品管理」から入荷記録を追加
4. **部品発注**：「部品管理」または「発注管理」から発注・納入予定を管理
5. **製造**：「商品管理」または「製造管理」から製造実行（部品消費・商品在庫増加）
6. **販売**：「商品管理」または「売上管理」から販売記録
7. **ダッシュボード/カレンダー**：全体状況・アラート・予定を一目で把握

---

## アーキテクチャ

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend    │    │   Backend     │    │  Database     │
│   Vue.js 3    │◄──►│ Express.js    │◄──►│   SQLite      │
│ + Tailwind    │    │ + TypeScript  │    │ (File-based)  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## ライセンス

MIT License
