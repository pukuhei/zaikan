import { Router } from 'express';
import { db } from '../models/database';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

// ダッシュボード用カレンダーデータ取得
router.get('/calendar/:year/:month', (req, res, next) => {
  try {
    const { year, month } = req.params;
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const startDate = format(startOfMonth(targetDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(targetDate), 'yyyy-MM-dd');

    // 製造記録を取得
    const manufacturingRecords = db.prepare(`
      SELECT 
        mr.manufacturing_date,
        mr.quantity,
        p.name as product_name,
        p.id as product_id
      FROM manufacturing_records mr
      JOIN products p ON mr.product_id = p.id
      WHERE mr.manufacturing_date BETWEEN ? AND ?
      ORDER BY mr.manufacturing_date ASC
    `).all(startDate, endDate) as any[];

    // 入荷予定を取得
    const deliverySchedule = db.prepare(`
      SELECT 
        po.expected_delivery_date,
        po.quantity,
        p.name as part_name,
        p.id as part_id
      FROM part_orders po
      JOIN parts p ON po.part_id = p.id
      WHERE po.expected_delivery_date BETWEEN ? AND ?
        AND po.status IN ('ordered', 'shipped')
      ORDER BY po.expected_delivery_date ASC
    `).all(startDate, endDate) as any[];

    // 全商品とその製造可能数を取得
    const products = db.prepare(`
      SELECT id, name, current_stock
      FROM products
      ORDER BY name
    `).all() as any[];

    const calendarEvents = [];

    // 製造記録をイベントに変換
    manufacturingRecords.forEach(record => {
      calendarEvents.push({
        id: `manufacturing-${record.product_id}-${record.manufacturing_date}`,
        title: `${record.product_name}: ${record.quantity}個製造`,
        date: record.manufacturing_date,
        backgroundColor: '#3b82f6', // 青色
        borderColor: '#1d4ed8',
        textColor: '#ffffff',
        type: 'manufacturing'
      });
    });

    // 各商品の日別製造可能数を計算
    for (const product of products) {
      const dailyCapacities = calculateDailyCapacityWithDeliveries(product.id, startDate, endDate, deliverySchedule);
      
      for (const [dateStr, capacity] of Object.entries(dailyCapacities)) {
        if (capacity > 0) {
          const date = new Date(dateStr);
          const today = new Date();
          
          // 今日以降の日付のみ表示
          if (date >= today || dateStr >= format(today, 'yyyy-MM-dd')) {
            calendarEvents.push({
              id: `capacity-${product.id}-${dateStr}`,
              title: `${product.name}: ${capacity}個製造可能`,
              date: dateStr,
              backgroundColor: '#10b981', // 緑色
              borderColor: '#059669',
              textColor: '#ffffff',
              type: 'capacity'
            });
          }
        }
      }
    }

    // 入荷予定イベントを表示
    deliverySchedule.forEach(delivery => {
      calendarEvents.push({
        id: `delivery-${delivery.part_id}-${delivery.expected_delivery_date}`,
        title: `${delivery.part_name}: ${delivery.quantity}個入荷予定`,
        date: delivery.expected_delivery_date,
        backgroundColor: '#f59e0b', // オレンジ色
        borderColor: '#d97706',
        textColor: '#ffffff',
        type: 'delivery'
      });
    });

    res.json({
      events: calendarEvents,
      manufacturingRecords,
      deliverySchedule
    });
  } catch (error) {
    next(error);
  }
});

// 現在の在庫での製造可能数を計算
function calculateCurrentCapacity(productId: number): number {
  try {
    // 商品のレシピを取得
    const recipe = db.prepare(`
      SELECT pr.quantity_required, p.current_stock
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
    `).all(productId) as any[];

    if (recipe.length === 0) return 0;

    // 各部品から製造可能数を計算し、最小値を返す
    let minCapacity = Infinity;
    recipe.forEach(item => {
      const possibleQuantity = Math.floor(item.current_stock / item.quantity_required);
      if (possibleQuantity < minCapacity) {
        minCapacity = possibleQuantity;
      }
    });

    return minCapacity === Infinity ? 0 : minCapacity;
  } catch (error) {
    return 0;
  }
}

// 日別の製造可能数を入荷予定を考慮して計算
function calculateDailyCapacityWithDeliveries(
  productId: number, 
  startDate: string, 
  endDate: string, 
  deliverySchedule: any[]
): Record<string, number> {
  try {
    const dailyCapacities: Record<string, number> = {};
    
    // 商品のレシピを取得
    const recipe = db.prepare(`
      SELECT pr.part_id, pr.quantity_required, p.current_stock, p.name as part_name
      FROM product_recipes pr
      JOIN parts p ON pr.part_id = p.id
      WHERE pr.product_id = ?
    `).all(productId) as any[];

    if (recipe.length === 0) return dailyCapacities;

    // 部品在庫のシミュレーション用マップ（初期在庫）
    const initialPartStocks: Record<number, number> = {};
    recipe.forEach(item => {
      initialPartStocks[item.part_id] = item.current_stock;
    });

    // 入荷予定を日付順にソート
    const sortedDeliveries = deliverySchedule
      .filter(d => d.expected_delivery_date >= startDate && d.expected_delivery_date <= endDate)
      .sort((a, b) => a.expected_delivery_date.localeCompare(b.expected_delivery_date));

    // 開始日から終了日まで日別に計算
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // この日時点での在庫を計算（初期在庫 + この日までの入荷分）
      const currentPartStocks: Record<number, number> = { ...initialPartStocks };
      
      sortedDeliveries.forEach(delivery => {
        if (delivery.expected_delivery_date <= dateStr) {
          // この部品がレシピに含まれているか確認
          const recipeItem = recipe.find(item => item.part_id === delivery.part_id);
          if (recipeItem) {
            currentPartStocks[delivery.part_id] = (currentPartStocks[delivery.part_id] || 0) + delivery.quantity;
          }
        }
      });

      // この日の製造可能数を計算
      let minCapacity = Infinity;
      recipe.forEach(item => {
        const availableStock = currentPartStocks[item.part_id] || 0;
        const possibleQuantity = Math.floor(availableStock / item.quantity_required);
        if (possibleQuantity < minCapacity) {
          minCapacity = possibleQuantity;
        }
      });

      dailyCapacities[dateStr] = minCapacity === Infinity ? 0 : minCapacity;
    }

    return dailyCapacities;
  } catch (error) {
    console.error(`Error calculating daily capacity for product ${productId}:`, error);
    return {};
  }
}


export default router;