import { Router } from 'express';
import { db } from '../models/database';

const router = Router();

// 在庫入荷記録一覧取得
router.get('/', (req, res, next) => {
  try {
    const entries = db.prepare(`
      SELECT se.*, p.name as part_name
      FROM stock_entries se
      JOIN parts p ON se.part_id = p.id
      ORDER BY se.entry_date DESC, se.created_at DESC
    `).all();
    
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// 特定の部品の入荷記録取得
router.get('/part/:partId', (req, res, next) => {
  try {
    const { partId } = req.params;
    
    const entries = db.prepare(`
      SELECT se.*, p.name as part_name
      FROM stock_entries se
      JOIN parts p ON se.part_id = p.id
      WHERE se.part_id = ?
      ORDER BY se.entry_date DESC, se.created_at DESC
    `).all(partId);
    
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

export default router;