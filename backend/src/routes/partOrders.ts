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