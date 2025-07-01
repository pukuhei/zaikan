import { z } from 'zod';

// 部品関连のスキーマ
export const PartSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, '部品名は必須です'),
  unit_price: z.number().min(0, '単価は0以上である必要があります').optional(),
  current_stock: z.number().int().min(0, '在庫数は0以上である必要があります').default(0),
  min_stock_alert: z.number().int().min(0, '最小在庫数は0以上である必要があります').default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreatePartSchema = PartSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdatePartSchema = PartSchema.partial().omit({ id: true, created_at: true, updated_at: true });

// 商品関連のスキーマ
export const ProductSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, '商品名は必須です'),
  selling_price: z.number().min(0, '販売価格は0以上である必要があります').optional(),
  current_stock: z.number().int().min(0, '在庫数は0以上である必要があります').default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateProductSchema = ProductSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateProductSchema = ProductSchema.partial().omit({ id: true, created_at: true, updated_at: true });

// レシピ関連のスキーマ
export const ProductRecipeSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().int().positive('商品IDは必須です'),
  part_id: z.number().int().positive('部品IDは必須です'),
  quantity_required: z.number().int().positive('必要数量は1以上である必要があります'),
});

export const CreateProductRecipeSchema = ProductRecipeSchema.omit({ id: true });

// 在庫入荷関連のスキーマ
export const StockEntrySchema = z.object({
  id: z.number().optional(),
  part_id: z.number().int().positive('部品IDは必須です'),
  quantity: z.number().int().positive('数量は1以上である必要があります'),
  unit_price: z.number().min(0, '単価は0以上である必要があります').optional(),
  entry_date: z.string().min(1, '入荷日は必須です'),
  notes: z.string().optional(),
  created_at: z.string().optional(),
});

export const CreateStockEntrySchema = StockEntrySchema.omit({ id: true, created_at: true });

// 発注関連のスキーマ
export const PartOrderSchema = z.object({
  id: z.number().optional(),
  part_id: z.number().int().positive('部品IDは必須です'),
  quantity: z.number().int().positive('数量は1以上である必要があります'),
  order_date: z.string().min(1, '発注日は必須です'),
  expected_delivery_date: z.string().optional(),
  status: z.enum(['ordered', 'shipped', 'delivered', 'cancelled']).default('ordered'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreatePartOrderSchema = PartOrderSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdatePartOrderSchema = PartOrderSchema.partial().omit({ id: true, created_at: true, updated_at: true });

// 製造記録関連のスキーマ
export const ManufacturingRecordSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().int().positive('商品IDは必須です'),
  quantity: z.number().int().positive('数量は1以上である必要があります'),
  manufacturing_date: z.string().min(1, '製造日は必須です'),
  notes: z.string().optional(),
  created_at: z.string().optional(),
});

export const CreateManufacturingRecordSchema = ManufacturingRecordSchema.omit({ id: true, created_at: true });

// 売上記録関連のスキーマ
export const SalesRecordSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().int().positive('商品IDは必須です'),
  quantity: z.number().int().positive('数量は1以上である必要があります'),
  unit_price: z.number().min(0, '単価は0以上である必要があります'),
  total_amount: z.number().min(0, '合計金額は0以上である必要があります'),
  sale_date: z.string().min(1, '販売日は必須です'),
  notes: z.string().optional(),
  created_at: z.string().optional(),
});

export const CreateSalesRecordSchema = SalesRecordSchema.omit({ id: true, created_at: true });

// TypeScriptの型定義
export type Part = z.infer<typeof PartSchema>;
export type CreatePart = z.infer<typeof CreatePartSchema>;
export type UpdatePart = z.infer<typeof UpdatePartSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

export type ProductRecipe = z.infer<typeof ProductRecipeSchema>;
export type CreateProductRecipe = z.infer<typeof CreateProductRecipeSchema>;

export type StockEntry = z.infer<typeof StockEntrySchema>;
export type CreateStockEntry = z.infer<typeof CreateStockEntrySchema>;

export type PartOrder = z.infer<typeof PartOrderSchema>;
export type CreatePartOrder = z.infer<typeof CreatePartOrderSchema>;
export type UpdatePartOrder = z.infer<typeof UpdatePartOrderSchema>;

export type ManufacturingRecord = z.infer<typeof ManufacturingRecordSchema>;
export type CreateManufacturingRecord = z.infer<typeof CreateManufacturingRecordSchema>;

export type SalesRecord = z.infer<typeof SalesRecordSchema>;
export type CreateSalesRecord = z.infer<typeof CreateSalesRecordSchema>;