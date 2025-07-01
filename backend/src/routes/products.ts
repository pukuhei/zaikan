import { Router } from 'express';
import { db } from '../models/database';
import { CreateProductSchema, UpdateProductSchema, CreateProductRecipeSchema, CreateSalesRecordSchema } from '../models/types';

const router = Router();

// 商品一覧取得
router.get('/', (req, res, next) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// 商品詳細取得
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// 商品新規作成
router.post('/', (req, res, next) => {
  try {
    const validatedData = CreateProductSchema.parse(req.body);
    
    const stmt = db.prepare(`
      INSERT INTO products (name, selling_price, current_stock)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      validatedData.name,
      validatedData.selling_price,
      validatedData.current_stock
    );
    
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid) as any;
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
});

// 商品更新
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateProductSchema.parse(req.body);
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
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
        UPDATE products SET ${updateFields.join(', ')} WHERE id = ?
      `);
      stmt.run(...updateValues);
    }
    
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
});

// 商品削除
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 商品レシピ取得
router.get('/:id/recipe', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    const recipe = db.prepare(`
      SELECT pr.*, p.name as part_name, p.unit_price as part_unit_price, p.current_stock as part_current_stock
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
      ORDER BY p.name
    `).all(id);
    
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

// 商品レシピ設定
router.post('/:id/recipe', (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipes } = req.body; // Array of recipe items
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    const transaction = db.transaction(() => {
      // 既存のレシピを削除
      db.prepare('DELETE FROM product_recipes WHERE product_id = ?').run(id);
      
      // 新しいレシピを追加
      const insertStmt = db.prepare(`
        INSERT INTO product_recipes (product_id, part_id, quantity_required)
        VALUES (?, ?, ?)
      `);
      
      recipes.forEach((recipe: any) => {
        const validatedRecipe = CreateProductRecipeSchema.parse({
          ...recipe,
          product_id: parseInt(id)
        });
        
        insertStmt.run(
          validatedRecipe.product_id,
          validatedRecipe.part_id,
          validatedRecipe.quantity_required
        );
      });
    });
    
    transaction();
    
    // 更新されたレシピを返す
    const updatedRecipe = db.prepare(`
      SELECT pr.*, p.name as part_name, p.unit_price as part_unit_price, p.current_stock as part_current_stock
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
      ORDER BY p.name
    `).all(id);
    
    res.json(updatedRecipe);
  } catch (error) {
    next(error);
  }
});

// 商品コピー（レシピも含む）
router.post('/:id/copy', (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: '新しい商品名が必要です' });
    }
    
    const originalProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!originalProduct) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    // 既存の商品名をチェック
    const existingProduct = db.prepare('SELECT * FROM products WHERE name = ?').get(name) as any;
    if (existingProduct) {
      return res.status(400).json({ error: 'その商品名は既に使用されています' });
    }
    
    const transaction = db.transaction(() => {
      // 新しい商品を作成（在庫は0で開始）
      const newProductStmt = db.prepare(`
        INSERT INTO products (name, selling_price, current_stock)
        VALUES (?, ?, 0)
      `);
      
      const newProductResult = newProductStmt.run(
        name,
        originalProduct.selling_price
      );
      
      const newProductId = newProductResult.lastInsertRowid;
      
      // 元の商品のレシピを取得
      const originalRecipes = db.prepare(`
        SELECT part_id, quantity_required
        FROM product_recipes
        WHERE product_id = ?
      `).all(id);
      
      // レシピを新しい商品にコピー
      if (originalRecipes.length > 0) {
        const copyRecipeStmt = db.prepare(`
          INSERT INTO product_recipes (product_id, part_id, quantity_required)
          VALUES (?, ?, ?)
        `);
        
        originalRecipes.forEach((recipe: any) => {
          copyRecipeStmt.run(
            newProductId,
            recipe.part_id,
            recipe.quantity_required
          );
        });
      }
      
      return newProductId;
    });
    
    const newProductId = transaction();
    
    // 新しい商品とそのレシピを返す
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(newProductId) as any;
    const newRecipe = db.prepare(`
      SELECT pr.*, p.name as part_name, p.unit_price as part_unit_price, p.current_stock as part_current_stock
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
      ORDER BY p.name
    `).all(newProductId);
    
    res.status(201).json({
      product: newProduct,
      recipe: newRecipe
    });
  } catch (error) {
    next(error);
  }
});

// 商品販売
router.post('/:id/sell', (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, unit_price, sale_date, notes } = req.body;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: '商品が見つかりません' });
    }
    
    if (product.current_stock < quantity) {
      return res.status(400).json({ error: '在庫が不足しています' });
    }
    
    const total_amount = quantity * unit_price;
    
    const validatedData = CreateSalesRecordSchema.parse({
      product_id: parseInt(id),
      quantity,
      unit_price,
      total_amount,
      sale_date,
      notes
    });
    
    const transaction = db.transaction(() => {
      // 売上記録を追加
      const salesStmt = db.prepare(`
        INSERT INTO sales_records (product_id, quantity, unit_price, total_amount, sale_date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      salesStmt.run(
        validatedData.product_id,
        validatedData.quantity,
        validatedData.unit_price,
        validatedData.total_amount,
        validatedData.sale_date,
        validatedData.notes
      );
      
      // 商品在庫を減らす
      const updateStmt = db.prepare(`
        UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(validatedData.quantity, id);
    });
    
    transaction();
    
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
});

export default router;