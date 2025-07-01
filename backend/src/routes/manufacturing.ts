import { Router } from 'express';
import { db } from '../models/database';
import { CreateManufacturingRecordSchema } from '../models/types';

const router = Router();

// 商品製造
router.post('/products/:id/manufacture', (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, manufacturing_date, notes } = req.body;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // レシピを取得
    const recipe = db.prepare(`
      SELECT pr.*, p.name as part_name, p.current_stock
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
    `).all(id) as any[];
    
    if (recipe.length === 0) {
      return res.status(400).json({ error: 'この商品にはレシピが設定されていません' });
    }
    
    // 必要な部品の在庫チェック
    const insufficientParts = [];
    for (const item of recipe) {
      const requiredQuantity = item.quantity_required * quantity;
      if (item.current_stock < requiredQuantity) {
        insufficientParts.push({
          part_name: item.part_name,
          required: requiredQuantity,
          available: item.current_stock,
          shortage: requiredQuantity - item.current_stock
        });
      }
    }
    
    if (insufficientParts.length > 0) {
      return res.status(400).json({
        error: '部品の在庫が不足しています',
        insufficientParts
      });
    }
    
    const validatedData = CreateManufacturingRecordSchema.parse({
      product_id: parseInt(id),
      quantity,
      manufacturing_date,
      notes
    });
    
    const transaction = db.transaction(() => {
      // 製造記録を追加
      const manufacturingStmt = db.prepare(`
        INSERT INTO manufacturing_records (product_id, quantity, manufacturing_date, notes)
        VALUES (?, ?, ?, ?)
      `);
      
      manufacturingStmt.run(
        validatedData.product_id,
        validatedData.quantity,
        validatedData.manufacturing_date,
        validatedData.notes
      );
      
      // 各部品の在庫を減らす
      const updatePartStmt = db.prepare(`
        UPDATE parts SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      recipe.forEach(item => {
        const requiredQuantity = item.quantity_required * quantity;
        updatePartStmt.run(requiredQuantity, item.part_id);
      });
      
      // 商品の在庫を増やす
      const updateProductStmt = db.prepare(`
        UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateProductStmt.run(validatedData.quantity, id);
    });
    
    transaction();
    
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
});

// 製造記録一覧取得
router.get('/records', (req, res, next) => {
  try {
    const records = db.prepare(`
      SELECT mr.*, p.name as product_name
      FROM manufacturing_records mr
      JOIN products p ON mr.product_id = p.id
      ORDER BY mr.manufacturing_date DESC, mr.created_at DESC
    `).all();
    
    res.json(records);
  } catch (error) {
    next(error);
  }
});

// 製造可能数確認
router.get('/capacity/:productId', (req, res, next) => {
  try {
    const { productId } = req.params;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // レシピを取得
    const recipe = db.prepare(`
      SELECT pr.*, p.name as part_name, p.current_stock
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
    `).all(productId) as any[];
    
    if (recipe.length === 0) {
      return res.json({
        product_name: product.name,
        max_manufacturable: 0,
        limiting_parts: [],
        message: 'レシピが設定されていません'
      });
    }
    
    // 各部品から製造可能数を計算
    let maxManufacturable = Infinity;
    const partCapacities: any[] = [];
    
    recipe.forEach(item => {
      const possibleQuantity = Math.floor(item.current_stock / item.quantity_required);
      partCapacities.push({
        part_name: item.part_name,
        current_stock: item.current_stock,
        required_per_product: item.quantity_required,
        max_manufacturable: possibleQuantity
      });
      
      if (possibleQuantity < maxManufacturable) {
        maxManufacturable = possibleQuantity;
      }
    });
    
    // 制限要因となる部品
    const limitingParts = partCapacities.filter(p => p.max_manufacturable === maxManufacturable);
    
    res.json({
      product_name: product.name,
      max_manufacturable: maxManufacturable === Infinity ? 0 : maxManufacturable,
      part_capacities: partCapacities,
      limiting_parts: limitingParts
    });
  } catch (error) {
    next(error);
  }
});

// 製造カレンダー
router.get('/calendar/:year/:month', (req, res, next) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    const manufacturing = db.prepare(`
      SELECT mr.*, p.name as product_name
      FROM manufacturing_records mr
      JOIN products p ON mr.product_id = p.id
      WHERE mr.manufacturing_date BETWEEN ? AND ?
      ORDER BY mr.manufacturing_date ASC
    `).all(startDate, endDate);
    
    res.json(manufacturing);
  } catch (error) {
    next(error);
  }
});

export default router;