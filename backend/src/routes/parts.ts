import { Router } from 'express';
import { db } from '../models/database';
import { CreatePartSchema, UpdatePartSchema, CreateStockEntrySchema, CreatePartOrderSchema } from '../models/types';

const router = Router();

// 部品一覧取得
router.get('/', (req, res, next) => {
  try {
    const parts = db.prepare('SELECT * FROM parts ORDER BY created_at DESC').all();
    res.json(parts);
  } catch (error) {
    next(error);
  }
});

// 在庫不足部品一覧取得
router.get('/low-stock', (req, res, next) => {
  try {
    const lowStockParts = db.prepare(`
      SELECT * FROM parts 
      WHERE current_stock <= min_stock_alert 
      ORDER BY (current_stock - min_stock_alert) ASC
    `).all();
    res.json(lowStockParts);
  } catch (error) {
    next(error);
  }
});

// 部品詳細取得
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    
    if (!part) {
      return res.status(404).json({ error: '部品が見つかりません' });
    }
    
    res.json(part);
  } catch (error) {
    next(error);
  }
});

// 部品新規作成
router.post('/', (req, res, next) => {
  try {
    const validatedData = CreatePartSchema.parse(req.body);
    
    const stmt = db.prepare(`
      INSERT INTO parts (name, unit_price, current_stock, min_stock_alert)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      validatedData.name,
      validatedData.unit_price,
      validatedData.current_stock,
      validatedData.min_stock_alert
    );
    
    const newPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(result.lastInsertRowid) as any;
    res.status(201).json(newPart);
  } catch (error) {
    next(error);
  }
});

// 部品更新
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = UpdatePartSchema.parse(req.body);
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    if (!part) {
      return res.status(404).json({ error: '部品が見つかりません' });
    }
    
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);
      
      const stmt = db.prepare(`
        UPDATE parts SET ${updateFields.join(', ')} WHERE id = ?
      `);
      stmt.run(...updateValues);
    }
    
    const updatedPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    res.json(updatedPart);
  } catch (error) {
    next(error);
  }
});

// 部品削除
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    if (!part) {
      return res.status(404).json({ error: '部品が見つかりません' });
    }
    
    db.prepare('DELETE FROM parts WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 在庫入荷記録
router.post('/:id/stock-entry', (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = CreateStockEntrySchema.parse({
      ...req.body,
      part_id: parseInt(id)
    });
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    if (!part) {
      return res.status(404).json({ error: '部品が見つかりません' });
    }
    
    const transaction = db.transaction(() => {
      // 在庫入荷記録を追加
      const entryStmt = db.prepare(`
        INSERT INTO stock_entries (part_id, quantity, unit_price, entry_date, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      entryStmt.run(
        validatedData.part_id,
        validatedData.quantity,
        validatedData.unit_price,
        validatedData.entry_date,
        validatedData.notes
      );
      
      // 部品の在庫数を更新
      const updateStmt = db.prepare(`
        UPDATE parts SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(validatedData.quantity, id);
    });
    
    transaction();
    
    const updatedPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    res.json(updatedPart);
  } catch (error) {
    next(error);
  }
});

// 部品発注
router.post('/:id/order', (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = CreatePartOrderSchema.parse({
      ...req.body,
      part_id: parseInt(id)
    });
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as any;
    if (!part) {
      return res.status(404).json({ error: '部品が見つかりません' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO part_orders (part_id, quantity, order_date, expected_delivery_date, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      validatedData.part_id,
      validatedData.quantity,
      validatedData.order_date,
      validatedData.expected_delivery_date,
      validatedData.status
    );
    
    const newOrder = db.prepare(`
      SELECT po.*, p.name as part_name 
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      WHERE po.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
});

export default router;