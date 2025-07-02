import { Router } from 'express';
import { db } from '../models/database';
import { UpdatePartOrderSchema } from '../models/types';

const router = Router();

// 発注一覧取得
router.get('/', (req, res, next) => {
  try {
    const orders = db.prepare(`
      SELECT po.*, p.name as part_name, p.unit_price as part_unit_price
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      ORDER BY po.order_date DESC, po.created_at DESC
    `).all();
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 発注詳細取得
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = db.prepare(`
      SELECT po.*, p.name as part_name, p.unit_price as part_unit_price
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      WHERE po.id = ?
    `).get(id);
    
    if (!order) {
      return res.status(404).json({ error: '発注が見つかりません' });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 発注状況更新
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = UpdatePartOrderSchema.parse(req.body);
    
    const order = db.prepare('SELECT * FROM part_orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: '発注が見つかりません' });
    }
    
    // 「納入済み」に変更する場合は在庫を自動更新
    const isChangingToDelivered = validatedData.status === 'delivered' && order.status !== 'delivered';
    
    const transaction = db.transaction(() => {
      // 発注情報を更新
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
          UPDATE part_orders SET ${updateFields.join(', ')} WHERE id = ?
        `);
        stmt.run(...updateValues);
      }
      
      // 「納入済み」に変更した場合は在庫を自動更新
      if (isChangingToDelivered) {
        // 在庫入荷記録を追加
        const stockEntryStmt = db.prepare(`
          INSERT INTO stock_entries (part_id, quantity, unit_price, entry_date, notes)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const today = new Date().toISOString().split('T')[0];
        const notes = `発注ID:${id} からの自動在庫更新`;
        
        stockEntryStmt.run(
          order.part_id,
          order.quantity,
          order.part_unit_price || null,
          today,
          notes
        );
        
        // 部品の在庫数を更新
        const updatePartStmt = db.prepare(`
          UPDATE parts SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        updatePartStmt.run(order.quantity, order.part_id);
      }
    });
    
    transaction();
    
    const updatedOrder = db.prepare(`
      SELECT po.*, p.name as part_name, p.unit_price as part_unit_price
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      WHERE po.id = ?
    `).get(id);
    
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// 発注納入（専用エンドポイント）
router.post('/:id/deliver', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = db.prepare('SELECT * FROM part_orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: '発注が見つかりません' });
    }
    
    if (order.status === 'delivered') {
      return res.status(400).json({ error: '既に納入済みです' });
    }
    
    // 部品情報を取得（単価取得のため）
    const part = db.prepare('SELECT unit_price FROM parts WHERE id = ?').get(order.part_id) as any;
    
    const transaction = db.transaction(() => {
      // 発注状態を「納入済み」に更新
      const updateOrderStmt = db.prepare(`
        UPDATE part_orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateOrderStmt.run(id);
      
      // 在庫入荷記録を追加（現在の日付、部品の単価を使用）
      const stockEntryStmt = db.prepare(`
        INSERT INTO stock_entries (part_id, quantity, unit_price, entry_date, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const today = new Date().toISOString().split('T')[0];
      const notes = `発注ID:${id} からの自動納入処理`;
      
      stockEntryStmt.run(
        order.part_id,
        order.quantity,
        part.unit_price || null,
        today,
        notes
      );
      
      // 部品の在庫数を更新
      const updatePartStmt = db.prepare(`
        UPDATE parts SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updatePartStmt.run(order.quantity, order.part_id);
    });
    
    transaction();
    
    const updatedOrder = db.prepare(`
      SELECT po.*, p.name as part_name, p.unit_price as part_unit_price
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      WHERE po.id = ?
    `).get(id);
    
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// 発注削除
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = db.prepare('SELECT * FROM part_orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: '発注が見つかりません' });
    }
    
    // 既に納入済みの発注は削除不可
    if (order.status === 'delivered') {
      return res.status(400).json({ error: '納入済みの発注は削除できません' });
    }
    
    db.prepare('DELETE FROM part_orders WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 納入予定カレンダー
router.get('/calendar/:year/:month', (req, res, next) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    const deliveries = db.prepare(`
      SELECT po.*, p.name as part_name
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      WHERE po.expected_delivery_date BETWEEN ? AND ?
        AND po.status IN ('ordered', 'shipped')
      ORDER BY po.expected_delivery_date ASC
    `).all(startDate, endDate);
    
    res.json(deliveries);
  } catch (error) {
    next(error);
  }
});

export default router;