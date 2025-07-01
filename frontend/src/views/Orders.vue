<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">発注管理</h1>
      <p class="mt-1 text-sm text-gray-600">部品の発注状況と納入予定管理</p>
    </div>

    <!-- 発注一覧 -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">発注一覧</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                部品名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                発注数量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                発注日
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                納入予定日
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in orders" :key="order.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ order.part_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ order.quantity }}個
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(order.order_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="order.expected_delivery_date">
                  {{ formatDate(order.expected_delivery_date) }}
                </span>
                <span v-else class="text-gray-400">未設定</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusClass(order.status)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStatusText(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button @click="updateOrderStatus(order)" class="btn-primary text-xs px-3 py-1">
                  状態更新
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 状態更新モーダル -->
    <div v-if="showStatusModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          発注状態更新 - {{ selectedOrder?.part_name }}
        </h3>
        <form @submit.prevent="submitStatusUpdate">
          <div class="space-y-4">
            <div>
              <label class="form-label">状態</label>
              <select v-model="statusForm.status" class="form-input" required>
                <option value="ordered">発注済み</option>
                <option value="shipped">出荷済み</option>
                <option value="delivered">納入済み</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div>
              <label class="form-label">納入予定日</label>
              <input v-model="statusForm.expected_delivery_date" type="date" class="form-input" />
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-primary flex-1">更新</button>
            <button type="button" @click="closeModal" class="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 今月の納入予定 -->
    <div class="card">
      <h2 class="text-lg font-medium text-gray-900 mb-4">今月の納入予定</h2>
      <div v-if="currentMonthDeliveries.length === 0" class="text-gray-500 text-sm">
        今月の納入予定はありません
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="delivery in currentMonthDeliveries"
          :key="delivery.id"
          class="flex justify-between items-center p-3 border rounded-lg"
        >
          <div>
            <p class="font-medium text-gray-900">{{ delivery.part_name }}</p>
            <p class="text-sm text-gray-500">{{ delivery.quantity }}個</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900">
              {{ formatDate(delivery.expected_delivery_date!) }}
            </p>
            <span
              :class="getStatusClass(delivery.status)"
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            >
              {{ getStatusText(delivery.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ordersApi } from '@/services/api'
import type { PartOrder } from '@/types'

const orders = ref<PartOrder[]>([])
const showStatusModal = ref(false)
const selectedOrder = ref<PartOrder | null>(null)

const statusForm = ref({
  status: '' as 'ordered' | 'shipped' | 'delivered' | 'cancelled',
  expected_delivery_date: '',
})

const currentMonthDeliveries = computed(() => {
  const currentMonth = format(new Date(), 'yyyy-MM')
  return orders.value.filter(order => 
    order.expected_delivery_date && 
    order.expected_delivery_date.startsWith(currentMonth) &&
    order.status !== 'delivered' &&
    order.status !== 'cancelled'
  )
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'M月d日', { locale: ja })
}

const getStatusText = (status: string) => {
  const statusMap = {
    ordered: '発注済み',
    shipped: '出荷済み',
    delivered: '納入済み',
    cancelled: 'キャンセル'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusClass = (status: string) => {
  const classMap = {
    ordered: 'bg-blue-100 text-blue-800',
    shipped: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classMap[status as keyof typeof classMap] || 'bg-gray-100 text-gray-800'
}

const updateOrderStatus = (order: PartOrder) => {
  selectedOrder.value = order
  statusForm.value = {
    status: order.status,
    expected_delivery_date: order.expected_delivery_date || '',
  }
  showStatusModal.value = true
}

const closeModal = () => {
  showStatusModal.value = false
  selectedOrder.value = null
}

const submitStatusUpdate = async () => {
  if (!selectedOrder.value) return

  try {
    await ordersApi.update(selectedOrder.value.id, statusForm.value)
    await fetchOrders()
    closeModal()
  } catch (error) {
    console.error('Failed to update order status:', error)
  }
}

const fetchOrders = async () => {
  try {
    const response = await ordersApi.getAll()
    orders.value = response.data
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  }
}

onMounted(() => {
  fetchOrders()
})
</script>