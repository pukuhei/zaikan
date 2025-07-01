export interface Part {
  id: number
  name: string
  unit_price?: number
  current_stock: number
  min_stock_alert: number
  created_at: string
  updated_at: string
}

export interface CreatePart {
  name: string
  unit_price?: number
  current_stock?: number
  min_stock_alert?: number
}

export interface Product {
  id: number
  name: string
  selling_price?: number
  current_stock: number
  created_at: string
  updated_at: string
}

export interface CreateProduct {
  name: string
  selling_price?: number
  current_stock?: number
}

export interface ProductRecipe {
  id: number
  product_id: number
  part_id: number
  quantity_required: number
  part_name?: string
  part_unit_price?: number
  part_current_stock?: number
}

export interface CreateProductRecipe {
  part_id: number
  quantity_required: number
}

export interface StockEntry {
  id: number
  part_id: number
  quantity: number
  unit_price?: number
  entry_date: string
  notes?: string
  created_at: string
  part_name?: string
}

export interface CreateStockEntry {
  quantity: number
  unit_price?: number
  entry_date: string
  notes?: string
}

export interface PartOrder {
  id: number
  part_id: number
  quantity: number
  order_date: string
  expected_delivery_date?: string
  status: 'ordered' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
  part_name?: string
  part_unit_price?: number
}

export interface CreatePartOrder {
  quantity: number
  order_date: string
  expected_delivery_date?: string
  status?: 'ordered' | 'shipped' | 'delivered' | 'cancelled'
}

export interface ManufacturingRecord {
  id: number
  product_id: number
  quantity: number
  manufacturing_date: string
  notes?: string
  created_at: string
  product_name?: string
}

export interface CreateManufacturingRecord {
  quantity: number
  manufacturing_date: string
  notes?: string
}

export interface SalesRecord {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_amount: number
  sale_date: string
  notes?: string
  created_at: string
  product_name?: string
}

export interface CreateSalesRecord {
  quantity: number
  unit_price: number
  sale_date: string
  notes?: string
}

export interface ManufacturingCapacity {
  product_name: string
  max_manufacturable: number
  part_capacities: Array<{
    part_name: string
    current_stock: number
    required_per_product: number
    max_manufacturable: number
  }>
  limiting_parts: Array<{
    part_name: string
    current_stock: number
    required_per_product: number
    max_manufacturable: number
  }>
}

export interface SalesSummary {
  summary: Array<{
    period: string
    total_transactions: number
    total_quantity: number
    total_amount: number
    avg_amount: number
  }>
  total_stats: {
    total_transactions: number
    total_quantity: number
    total_amount: number
    avg_amount: number
    first_sale_date: string
    last_sale_date: string
  }
}