<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">販売管理</h1>
      <p class="mt-1 text-sm text-gray-600">売上記録と統計</p>
    </div>

    <!-- 売上統計 -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div class="card">
        <dl>
          <dt class="text-sm font-medium text-gray-500 truncate">総売上額</dt>
          <dd class="text-2xl font-bold text-gray-900">
            ¥{{ totalRevenue.toLocaleString() }}
          </dd>
        </dl>
      </div>
      <div class="card">
        <dl>
          <dt class="text-sm font-medium text-gray-500 truncate">総取引数</dt>
          <dd class="text-2xl font-bold text-gray-900">{{ totalTransactions }}</dd>
        </dl>
      </div>
      <div class="card">
        <dl>
          <dt class="text-sm font-medium text-gray-500 truncate">平均取引額</dt>
          <dd class="text-2xl font-bold text-gray-900">
            ¥{{ avgTransactionAmount.toLocaleString() }}
          </dd>
        </dl>
      </div>
      <div class="card">
        <dl>
          <dt class="text-sm font-medium text-gray-500 truncate">今月の売上</dt>
          <dd class="text-2xl font-bold text-gray-900">
            ¥{{ monthlyRevenue.toLocaleString() }}
          </dd>
        </dl>
      </div>
    </div>

    <!-- フィルタ -->
    <div class="card">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label class="form-label">開始日</label>
          <input v-model="startDate" type="date" class="form-input" @change="fetchSalesData" />
        </div>
        <div>
          <label class="form-label">終了日</label>
          <input v-model="endDate" type="date" class="form-input" @change="fetchSalesData" />
        </div>
        <div>
          <label class="form-label">商品</label>
          <select v-model="selectedProductId" class="form-input" @change="fetchSalesData">
            <option value="">すべての商品</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary">
            フィルタリセット
          </button>
        </div>
      </div>
    </div>

    <!-- 売上記録一覧 -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">売上記録</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売数量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                単価
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                合計金額
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売日
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                備考
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="sale in salesRecords" :key="sale.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ sale.product_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ sale.quantity }}個
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ¥{{ sale.unit_price.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ¥{{ sale.total_amount.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(sale.sale_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ sale.notes || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 商品別売上統計 -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">商品別売上統計</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売数量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                売上金額
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平均単価
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                取引回数
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="stat in productSalesStats" :key="stat.product_id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ stat.product_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ stat.total_quantity }}個
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ¥{{ stat.total_amount.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ¥{{ Math.round(stat.avg_unit_price).toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ stat.total_transactions }}回
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { format, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useProductsStore } from '@/stores/products'
import { salesApi } from '@/services/api'
import type { SalesRecord } from '@/types'

const productsStore = useProductsStore()
const { products } = storeToRefs(productsStore)

const salesRecords = ref<SalesRecord[]>([])
const productSalesStats = ref<any[]>([])
const startDate = ref('')
const endDate = ref('')
const selectedProductId = ref<number | ''>('')

const totalRevenue = computed(() => 
  salesRecords.value.reduce((sum, sale) => sum + sale.total_amount, 0)
)

const totalTransactions = computed(() => salesRecords.value.length)

const avgTransactionAmount = computed(() => 
  totalTransactions.value > 0 ? totalRevenue.value / totalTransactions.value : 0
)

const monthlyRevenue = computed(() => {
  const currentMonth = format(new Date(), 'yyyy-MM')
  return salesRecords.value
    .filter(sale => sale.sale_date.startsWith(currentMonth))
    .reduce((sum, sale) => sum + sale.total_amount, 0)
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'yyyy年M月d日', { locale: ja })
}

const resetFilters = () => {
  startDate.value = ''
  endDate.value = ''
  selectedProductId.value = ''
  fetchSalesData()
}

const fetchSalesData = async () => {
  try {
    const params: any = {}
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    if (selectedProductId.value) params.product_id = selectedProductId.value

    const [salesResponse, statsResponse] = await Promise.all([
      salesApi.getAll(params),
      salesApi.getByProduct(params)
    ])

    salesRecords.value = salesResponse.data
    productSalesStats.value = statsResponse.data
  } catch (error) {
    console.error('Failed to fetch sales data:', error)
  }
}

onMounted(async () => {
  // デフォルトで過去3ヶ月のデータを表示
  const threeMonthsAgo = subMonths(new Date(), 3)
  startDate.value = format(threeMonthsAgo, 'yyyy-MM-dd')
  endDate.value = format(new Date(), 'yyyy-MM-dd')

  await productsStore.fetchProducts()
  await fetchSalesData()
})
</script>