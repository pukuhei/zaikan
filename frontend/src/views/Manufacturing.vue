<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">製造計画</h1>
      <p class="mt-1 text-sm text-gray-600">製造記録とカレンダー表示</p>
    </div>

    <!-- 製造記録一覧 -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">最近の製造記録</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                製造数量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                製造日
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                備考
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="record in manufacturingRecords" :key="record.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ record.product_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ record.quantity }}個
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(record.manufacturing_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ record.notes || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 製造可能数一覧 -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">現在の製造可能数</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="product in products" :key="product.id" class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900">{{ product.name }}</h3>
          <p class="text-2xl font-bold text-primary-600 mt-2">
            {{ manufacturingCapacities[product.id] || 0 }}個
          </p>
          <p class="text-sm text-gray-500 mt-1">製造可能</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useProductsStore } from '@/stores/products'
import { manufacturingApi } from '@/services/api'
import type { ManufacturingRecord } from '@/types'

const productsStore = useProductsStore()
const { products } = storeToRefs(productsStore)

const manufacturingRecords = ref<ManufacturingRecord[]>([])
const manufacturingCapacities = ref<Record<number, number>>({})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'yyyy年M月d日', { locale: ja })
}

const fetchData = async () => {
  try {
    // 製造記録を取得
    const recordsResponse = await manufacturingApi.getRecords()
    manufacturingRecords.value = recordsResponse.data

    // 各商品の製造可能数を取得
    const capacities: Record<number, number> = {}
    for (const product of products.value) {
      try {
        const capacityResponse = await manufacturingApi.getCapacity(product.id)
        capacities[product.id] = capacityResponse.data.max_manufacturable
      } catch (error) {
        capacities[product.id] = 0
      }
    }
    manufacturingCapacities.value = capacities
  } catch (error) {
    console.error('Failed to fetch manufacturing data:', error)
  }
}

onMounted(async () => {
  await productsStore.fetchProducts()
  await fetchData()
})
</script>