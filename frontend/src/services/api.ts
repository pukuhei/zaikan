import axios from 'axios'
import type {
  Part, CreatePart,
  Product, CreateProduct, ProductRecipe, CreateProductRecipe,
  StockEntry, CreateStockEntry,
  PartOrder, CreatePartOrder,
  ManufacturingRecord, CreateManufacturingRecord, ManufacturingCapacity,
  SalesRecord, CreateSalesRecord, SalesSummary
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Parts API
export const partsApi = {
  getAll: () => api.get<Part[]>('/parts'),
  getLowStock: () => api.get<Part[]>('/parts/low-stock'),
  getById: (id: number) => api.get<Part>(`/parts/${id}`),
  create: (data: CreatePart) => api.post<Part>('/parts', data),
  update: (id: number, data: Partial<CreatePart>) => api.put<Part>(`/parts/${id}`, data),
  delete: (id: number) => api.delete(`/parts/${id}`),
  addStock: (id: number, data: CreateStockEntry) => api.post<Part>(`/parts/${id}/stock-entry`, data),
  createOrder: (id: number, data: CreatePartOrder) => api.post<PartOrder>(`/parts/${id}/order`, data),
}

// Products API
export const productsApi = {
  getAll: () => api.get<Product[]>('/products'),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: CreateProduct) => api.post<Product>('/products', data),
  update: (id: number, data: Partial<CreateProduct>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getRecipe: (id: number) => api.get<ProductRecipe[]>(`/products/${id}/recipe`),
  setRecipe: (id: number, recipes: CreateProductRecipe[]) => api.post<ProductRecipe[]>(`/products/${id}/recipe`, { recipes }),
  sell: (id: number, data: CreateSalesRecord & { unit_price: number }) => api.post<Product>(`/products/${id}/sell`, data),
}

// Stock Entries API
export const stockEntriesApi = {
  getAll: () => api.get<StockEntry[]>('/stock-entries'),
  getByPart: (partId: number) => api.get<StockEntry[]>(`/stock-entries/part/${partId}`),
}

// Orders API
export const ordersApi = {
  getAll: () => api.get<PartOrder[]>('/orders'),
  getById: (id: number) => api.get<PartOrder>(`/orders/${id}`),
  update: (id: number, data: Partial<CreatePartOrder>) => api.put<PartOrder>(`/orders/${id}`, data),
  getCalendar: (year: number, month: number) => api.get<PartOrder[]>(`/orders/calendar/${year}/${month}`),
}

// Manufacturing API
export const manufacturingApi = {
  manufacture: (productId: number, data: CreateManufacturingRecord) => api.post<Product>(`/manufacturing/products/${productId}/manufacture`, data),
  getRecords: () => api.get<ManufacturingRecord[]>('/manufacturing/records'),
  getCapacity: (productId: number) => api.get<ManufacturingCapacity>(`/manufacturing/capacity/${productId}`),
  getCalendar: (year: number, month: number) => api.get<ManufacturingRecord[]>(`/manufacturing/calendar/${year}/${month}`),
}

// Sales API
export const salesApi = {
  getAll: (params?: { start_date?: string, end_date?: string, product_id?: number }) => 
    api.get<SalesRecord[]>('/sales', { params }),
  getSummary: (params?: { start_date?: string, end_date?: string, group_by?: 'day' | 'month' | 'year' }) => 
    api.get<SalesSummary>('/sales/summary', { params }),
  getByProduct: (params?: { start_date?: string, end_date?: string }) => 
    api.get<Array<{
      product_id: number
      product_name: string
      current_selling_price: number
      total_transactions: number
      total_quantity: number
      total_amount: number
      avg_unit_price: number
      first_sale_date: string
      last_sale_date: string
    }>>('/sales/by-product', { params }),
  getTrend: (months = 12) => 
    api.get<Array<{
      month: string
      transactions: number
      quantity: number
      amount: number
    }>>('/sales/trend', { params: { months } }),
}

// Dashboard API
export const dashboardApi = {
  getCalendar: (year: number, month: number) => 
    api.get<{
      events: Array<{
        id: string
        title: string
        date: string
        backgroundColor: string
        borderColor: string
        textColor: string
        type: 'manufacturing' | 'capacity' | 'delivery_impact'
      }>
      manufacturingRecords: Array<{
        manufacturing_date: string
        quantity: number
        product_name: string
        product_id: number
      }>
      deliverySchedule: Array<{
        expected_delivery_date: string
        quantity: number
        part_name: string
        part_id: number
      }>
    }>(`/dashboard/calendar/${year}/${month}`),
}

export default api