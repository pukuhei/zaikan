<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">ダッシュボード</h1>
      <p class="mt-1 text-sm text-gray-600">在庫管理システムの概要</p>
    </div>

    <!-- ローディング状態 -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-sm text-gray-600">データを読み込み中...</p>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div v-else>

    <!-- 在庫警告アラート -->
    <div v-if="lowStockParts.length > 0" class="alert-warning">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">在庫不足の警告</h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>{{ lowStockParts.length }}個の部品が最小在庫数を下回っています。</p>
            <ul class="list-disc list-inside mt-1">
              <li v-for="part in lowStockParts.slice(0, 3)" :key="part.id">
                {{ part.name }}: {{ part.current_stock }}個 (最小: {{ part.min_stock_alert }}個)
              </li>
              <li v-if="lowStockParts.length > 3">
                他 {{ lowStockParts.length - 3 }}個の部品...
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品ごとの詳細カード -->
    <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="(product, index) in sortedProducts" :key="product.id" 
           class="card border-l-4 border-l-blue-500 interactive-card bounce-in"
           :style="{ animationDelay: `${index * 100}ms` }">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">{{ product.name }}</h3>
            <p class="text-sm text-gray-600">在庫: {{ product.current_stock }}個</p>
          </div>
          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="product.current_stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ product.current_stock > 0 ? '在庫あり' : '在庫なし' }}
            </span>
          </div>
        </div>
        
        <!-- 生産・売上情報 -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-xs text-gray-500">今月生産</div>
            <div class="text-lg font-medium text-blue-600">{{ productStats[product.id]?.monthlyProduction || 0 }}個</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500">生産可能</div>
            <div class="text-lg font-medium text-green-600">{{ manufacturingCapacities[product.id] || 0 }}個</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500">今月売上</div>
            <div class="text-lg font-medium text-purple-600">¥{{ (productStats[product.id]?.monthlyRevenue || 0).toLocaleString() }}</div>
          </div>
        </div>
        
        <!-- クイックアクション -->
        <div class="flex space-x-2">
          <button 
            @click="openQuickManufactureModal(product)" 
            :disabled="(manufacturingCapacities[product.id] || 0) === 0"
            class="btn-success ripple text-xs px-3 py-2 flex-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <CogIcon class="w-4 h-4 mr-1" />
            製造
          </button>
          <button 
            @click="openQuickSellModal(product)"
            :disabled="product.current_stock === 0"
            class="ripple text-xs px-3 py-2 flex-1 bg-purple-600 text-white hover:bg-purple-700 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <ShoppingCartIcon class="w-4 h-4 mr-1" />
            販売
          </button>
        </div>
      </div>
    </div>

    <!-- カレンダー表示 -->
    <div class="card">
      <h2 class="text-base sm:text-lg font-medium text-gray-900 mb-4">製造カレンダー</h2>
      <div class="mb-4">
        <div class="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span>製造実績</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span>製造可能数</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-orange-500 rounded mr-1"></div>
            <span>入荷予定</span>
          </div>
          <div class="text-xs text-gray-500 ml-2">
            ※入荷日以降は製造可能数が自動更新されます
          </div>
        </div>
      </div>
      <div class="overflow-hidden">
        <FullCalendar
          :options="calendarOptions"
          ref="calendar"
        />
      </div>
    </div>


    <!-- 統計サマリー -->
    <div class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
      <div class="card text-center interactive-card slide-in-right" style="animation-delay: 0ms;">
        <CubeIcon class="h-8 w-8 text-primary-600 mx-auto mb-2" />
        <div class="text-lg font-medium text-gray-900">{{ totalParts }}</div>
        <div class="text-xs text-gray-500">総部品数</div>
      </div>
      <div class="card text-center interactive-card slide-in-right" style="animation-delay: 100ms;">
        <ShoppingBagIcon class="h-8 w-8 text-green-600 mx-auto mb-2" />
        <div class="text-lg font-medium text-gray-900">{{ totalProducts }}</div>
        <div class="text-xs text-gray-500">総商品数</div>
      </div>
      <div class="card text-center interactive-card slide-in-right" style="animation-delay: 200ms;">
        <ExclamationTriangleIcon class="h-8 w-8 text-yellow-600 mx-auto mb-2" />
        <div class="text-lg font-medium text-gray-900">{{ lowStockParts.length }}</div>
        <div class="text-xs text-gray-500">在庫不足</div>
      </div>
      <div class="card text-center interactive-card slide-in-right" style="animation-delay: 300ms;">
        <CurrencyYenIcon class="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <div class="text-lg font-medium text-gray-900">¥{{ monthlyRevenue.toLocaleString() }}</div>
        <div class="text-xs text-gray-500">今月の売上</div>
      </div>
    </div>
    
    <!-- 最近の活動 -->
    <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      <!-- 最近の製造記録 -->
      <div class="card">
        <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-4">最近の製造記録</h3>
        <div v-if="recentManufacturing.length === 0" class="text-gray-500 text-xs sm:text-sm">
          製造記録がありません
        </div>
        <div v-else class="space-y-2 sm:space-y-3">
          <div
            v-for="record in recentManufacturing.slice(0, 5)"
            :key="record.id"
            class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{{ record.product_name }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(record.manufacturing_date) }}</p>
            </div>
            <div class="text-xs sm:text-sm text-gray-600 ml-2">
              {{ record.quantity }}個
            </div>
          </div>
        </div>
      </div>

      <!-- 最近の売上記録 -->
      <div class="card">
        <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-4">最近の売上記録</h3>
        <div v-if="recentSales.length === 0" class="text-gray-500 text-xs sm:text-sm">
          売上記録がありません
        </div>
        <div v-else class="space-y-2 sm:space-y-3">
          <div
            v-for="sale in recentSales.slice(0, 5)"
            :key="sale.id"
            class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{{ sale.product_name }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(sale.sale_date) }}</p>
            </div>
            <div class="text-xs sm:text-sm text-gray-600 ml-2">
              ¥{{ sale.total_amount.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- クイック製造モーダル -->
    <Transition name="fade">
      <div v-if="showQuickManufactureModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
        <Transition name="scale">
          <div v-if="showQuickManufactureModal" class="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
            <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-4">製造 - {{ selectedProduct?.name }}</h3>
            <form @submit.prevent="submitQuickManufacture">
              <div class="space-y-4">
                <div>
                  <label class="form-label text-sm">製造数量 *</label>
                  <input 
                    v-model.number="quickManufactureForm.quantity" 
                    type="number" 
                    min="1" 
                    :max="manufacturingCapacities[selectedProduct?.id || 0]"
                    required 
                    class="form-input text-sm" 
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    最大製造可能: {{ manufacturingCapacities[selectedProduct?.id || 0] }}個
                  </p>
                </div>
                <div>
                  <label class="form-label text-sm">製造日 *</label>
                  <input v-model="quickManufactureForm.manufacturing_date" type="date" required class="form-input text-sm" />
                </div>
                <div>
                  <label class="form-label text-sm">備考</label>
                  <textarea v-model="quickManufactureForm.notes" rows="3" class="form-input text-sm"></textarea>
                </div>
              </div>
              <div class="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button type="submit" class="btn-success flex-1 text-sm py-2">製造実行</button>
                <button type="button" @click="closeModals" class="btn-secondary flex-1 text-sm py-2">キャンセル</button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- クイック販売モーダル -->
    <Transition name="fade">
      <div v-if="showQuickSellModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
        <Transition name="scale">
          <div v-if="showQuickSellModal" class="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
            <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-4">販売 - {{ selectedProduct?.name }}</h3>
            <form @submit.prevent="submitQuickSell">
              <div class="space-y-4">
                <div>
                  <label class="form-label text-sm">販売数量 *</label>
                  <input 
                    v-model.number="quickSellForm.quantity" 
                    type="number" 
                    min="1" 
                    :max="selectedProduct?.current_stock"
                    required 
                    class="form-input text-sm" 
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    在庫: {{ selectedProduct?.current_stock }}個
                  </p>
                </div>
                <div>
                  <label class="form-label text-sm">販売単価 *</label>
                  <input v-model.number="quickSellForm.unit_price" type="number" step="0.01" min="0" required class="form-input text-sm" />
                </div>
                <div>
                  <label class="form-label text-sm">販売日 *</label>
                  <input v-model="quickSellForm.sale_date" type="date" required class="form-input text-sm" />
                </div>
                <div>
                  <label class="form-label text-sm">備考</label>
                  <textarea v-model="quickSellForm.notes" rows="3" class="form-input text-sm"></textarea>
                </div>
              </div>
              <div class="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button type="submit" class="btn-success flex-1 text-sm py-2">販売実行</button>
                <button type="button" @click="closeModals" class="btn-secondary flex-1 text-sm py-2">キャンセル</button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  ExclamationTriangleIcon,
  CubeIcon,
  ShoppingBagIcon,
  CurrencyYenIcon,
  CogIcon,
  ShoppingCartIcon,
} from '@heroicons/vue/24/outline'
import { usePartsStore } from '@/stores/parts'
import { useProductsStore } from '@/stores/products'
import { manufacturingApi, salesApi, dashboardApi } from '@/services/api'
import type { ManufacturingRecord, SalesRecord, Product, CreateManufacturingRecord, CreateSalesRecord } from '@/types'

// グローバルデータ用の型定義
declare global {
  interface Window {
    currentMonthSales?: SalesRecord[];
    currentMonthManufacturing?: ManufacturingRecord[];
  }
}

const partsStore = usePartsStore()
const productsStore = useProductsStore()

const recentManufacturing = ref<ManufacturingRecord[]>([])
const recentSales = ref<SalesRecord[]>([])
const monthlyRevenue = ref(0)
const calendarEvents = ref<any[]>([])
const manufacturingCapacities = ref<Record<number, number>>({})
const productStats = ref<Record<number, {
  monthlyProduction: number;
  monthlyRevenue: number;
}>>({})
const isLoading = ref(true)

// Modal states
const showQuickManufactureModal = ref(false)
const showQuickSellModal = ref(false)
const selectedProduct = ref<Product | null>(null)

// Forms
const quickManufactureForm = ref<CreateManufacturingRecord>({
  quantity: 1,
  manufacturing_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
})

const quickSellForm = ref<CreateSalesRecord & { unit_price: number }>({
  quantity: 1,
  unit_price: 0,
  sale_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
})

const { parts, lowStockParts, loading: partsLoading } = storeToRefs(partsStore)
const { products, sortedProducts, loading: productsLoading } = storeToRefs(productsStore)

const totalParts = computed(() => parts.value.length)
const totalProducts = computed(() => products.value.length)

// FullCalendar options
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'today'
  },
  locale: 'ja',
  events: calendarEvents,
  height: 'auto',
  eventDisplay: 'block',
  dayMaxEvents: 2,
  moreLinkClick: 'popover',
  aspectRatio: window.innerWidth < 768 ? 0.8 : 1.35,
  eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    omitZeroMinute: false,
    meridiem: 'short'
  }
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'M月d日', { locale: ja })
}

const fetchDashboardData = async () => {
  try {
    // 最近の製造記録を取得
    const manufacturingResponse = await manufacturingApi.getRecords()
    recentManufacturing.value = manufacturingResponse.data

    // 今月の売上データを取得（フィルター付き）
    const currentMonth = format(new Date(), 'yyyy-MM')
    const currentMonthStart = currentMonth + '-01'
    const currentMonthEnd = currentMonth + '-31'
    
    const salesResponse = await salesApi.getAll({
      start_date: currentMonthStart,
      end_date: currentMonthEnd
    })
    
    // 最近の売上記録（表示用）
    const allSalesResponse = await salesApi.getAll()
    recentSales.value = allSalesResponse.data.slice(0, 10)

    // 今月の総売上を計算
    monthlyRevenue.value = salesResponse.data.reduce((sum, sale) => sum + sale.total_amount, 0)
    
    // 商品統計用に今月のデータを保存
    window.currentMonthSales = salesResponse.data
    window.currentMonthManufacturing = manufacturingResponse.data.filter(record => 
      record.manufacturing_date.startsWith(currentMonth)
    )
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

const fetchCalendarData = async () => {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    
    const response = await dashboardApi.getCalendar(year, month)
    calendarEvents.value = response.data.events
  } catch (error) {
    console.error('Failed to fetch calendar data:', error)
  }
}

const fetchManufacturingCapacities = async () => {
  const capacities: Record<number, number> = {}
  
  for (const product of products.value) {
    try {
      const capacity = await manufacturingApi.getCapacity(product.id)
      capacities[product.id] = capacity.data.max_manufacturable
    } catch (error) {
      capacities[product.id] = 0
    }
  }
  
  manufacturingCapacities.value = capacities
}

const fetchProductStats = async () => {
  const stats: Record<number, {
    monthlyProduction: number;
    monthlyRevenue: number;
  }> = {}
  
  const currentMonth = format(new Date(), 'yyyy-MM')
  
  for (const product of products.value) {
    try {
      // 今月の製造数を取得（グローバルデータから）
      const monthlyManufacturing = (window.currentMonthManufacturing || []).filter(record => 
        record.product_id === product.id
      )
      const monthlyProduction = monthlyManufacturing.reduce((sum, record) => sum + record.quantity, 0)
      
      // 今月の売上を取得（グローバルデータから）
      const monthlySales = (window.currentMonthSales || []).filter(sale => 
        sale.product_id === product.id
      )
      const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.total_amount, 0)
      
      stats[product.id] = {
        monthlyProduction,
        monthlyRevenue
      }
    } catch (error) {
      console.error(`Failed to fetch stats for product ${product.id}:`, error)
      stats[product.id] = {
        monthlyProduction: 0,
        monthlyRevenue: 0
      }
    }
  }
  
  productStats.value = stats
}

// Modal functions
const openQuickManufactureModal = (product: Product) => {
  selectedProduct.value = product
  quickManufactureForm.value = {
    quantity: 1,
    manufacturing_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  }
  showQuickManufactureModal.value = true
}

const openQuickSellModal = (product: Product) => {
  selectedProduct.value = product
  quickSellForm.value = {
    quantity: 1,
    unit_price: product.selling_price || 0,
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  }
  showQuickSellModal.value = true
}

const closeModals = () => {
  showQuickManufactureModal.value = false
  showQuickSellModal.value = false
  selectedProduct.value = null
}

const submitQuickManufacture = async () => {
  if (!selectedProduct.value) return
  
  try {
    await manufacturingApi.manufacture(selectedProduct.value.id, quickManufactureForm.value)
    
    // データを再取得
    await Promise.all([
      productsStore.fetchProducts(),
      partsStore.fetchParts(),
    ])
    
    // ダッシュボードデータを再取得
    await fetchDashboardData()
    
    // その他のデータを再取得
    await Promise.all([
      fetchCalendarData(),
      fetchManufacturingCapacities(),
      fetchProductStats(),
    ])
    
    closeModals()
  } catch (error) {
    console.error('Failed to manufacture product:', error)
  }
}

const submitQuickSell = async () => {
  if (!selectedProduct.value) return
  
  try {
    await productsStore.sellProduct(selectedProduct.value.id, quickSellForm.value)
    
    // データを再取得
    await productsStore.fetchProducts()
    await fetchDashboardData()
    await fetchProductStats()
    
    closeModals()
  } catch (error) {
    console.error('Failed to sell product:', error)
  }
}

// ウィンドウリサイズ対応
const updateCalendarAspectRatio = () => {
  if (calendarOptions.value) {
    calendarOptions.value.aspectRatio = window.innerWidth < 768 ? 0.8 : 1.35
  }
}

onMounted(async () => {
  await Promise.all([
    partsStore.fetchParts(),
    partsStore.fetchLowStockParts(),
    productsStore.fetchProducts(),
  ])
  
  // まずダッシュボードデータを取得（他の関数が依存するため）
  await fetchDashboardData()
  
  // その後で他のデータを並行取得
  await Promise.all([
    fetchCalendarData(),
    fetchManufacturingCapacities(),
    fetchProductStats(),
  ])
  
  // ローディング終了
  isLoading.value = false
  
  // ウィンドウリサイズイベントリスナー追加
  window.addEventListener('resize', updateCalendarAspectRatio)
})

// クリーンアップ
onUnmounted(() => {
  window.removeEventListener('resize', updateCalendarAspectRatio)
})
</script>