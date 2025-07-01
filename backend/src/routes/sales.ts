import { Router } from 'express';
import { db } from '../models/database';

const router = Router();

// 売上記録一覧取得
router.get('/', (req, res, next) => {
  try {
    const { start_date, end_date, product_id } = req.query;
    
    let query = `
      SELECT sr.*, p.name as product_name
      FROM sales_records sr
      JOIN products p ON sr.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      query += ` AND sr.sale_date >= ?`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND sr.sale_date <= ?`;
      params.push(end_date);
    }
    
    if (product_id) {
      query += ` AND sr.product_id = ?`;
      params.push(product_id);
    }
    
    query += ` ORDER BY sr.sale_date DESC, sr.created_at DESC`;
    
    const sales = db.prepare(query).all(...params);
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// 売上サマリー
router.get('/summary', (req, res, next) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    
    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }
    
    let query = `
      SELECT 
        strftime('${dateFormat}', sr.sale_date) as period,
        COUNT(*) as total_transactions,
        SUM(sr.quantity) as total_quantity,
        SUM(sr.total_amount) as total_amount,
        AVG(sr.total_amount) as avg_amount
      FROM sales_records sr
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      query += ` AND sr.sale_date >= ?`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND sr.sale_date <= ?`;
      params.push(end_date);
    }
    
    query += ` GROUP BY strftime('${dateFormat}', sr.sale_date) ORDER BY period DESC`;
    
    const summary = db.prepare(query).all(...params);
    
    // 全体の統計も取得
    let totalQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(sr.quantity) as total_quantity,
        SUM(sr.total_amount) as total_amount,
        AVG(sr.total_amount) as avg_amount,
        MIN(sr.sale_date) as first_sale_date,
        MAX(sr.sale_date) as last_sale_date
      FROM sales_records sr
      WHERE 1=1
    `;
    const totalParams = [];
    
    if (start_date) {
      totalQuery += ` AND sr.sale_date >= ?`;
      totalParams.push(start_date);
    }
    
    if (end_date) {
      totalQuery += ` AND sr.sale_date <= ?`;
      totalParams.push(end_date);
    }
    
    const totalStats = db.prepare(totalQuery).get(...totalParams) as any;
    
    res.json({
      summary,
      total_stats: totalStats
    });
  } catch (error) {
    next(error);
  }
});

// 商品別売上統計
router.get('/by-product', (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        sr.product_id,
        p.name as product_name,
        p.selling_price as current_selling_price,
        COUNT(*) as total_transactions,
        SUM(sr.quantity) as total_quantity,
        SUM(sr.total_amount) as total_amount,
        AVG(sr.unit_price) as avg_unit_price,
        MIN(sr.sale_date) as first_sale_date,
        MAX(sr.sale_date) as last_sale_date
      FROM sales_records sr
      JOIN products p ON sr.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      query += ` AND sr.sale_date >= ?`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND sr.sale_date <= ?`;
      params.push(end_date);
    }
    
    query += ` GROUP BY sr.product_id, p.name ORDER BY total_amount DESC`;
    
    const productSales = db.prepare(query).all(...params);
    res.json(productSales);
  } catch (error) {
    next(error);
  }
});

// 月別売上トレンド
router.get('/trend', (req, res, next) => {
  try {
    const { months = 12 } = req.query;
    
    const trend = db.prepare(`
      SELECT 
        strftime('%Y-%m', sr.sale_date) as month,
        COUNT(*) as transactions,
        SUM(sr.quantity) as quantity,
        SUM(sr.total_amount) as amount
      FROM sales_records sr
      WHERE sr.sale_date >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', sr.sale_date)
      ORDER BY month ASC
    `).all();
    
    res.json(trend);
  } catch (error) {
    next(error);
  }
});

export default router;