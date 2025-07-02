<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">発注管理</h1>
      <p class="mt-1 text-sm text-gray-600">部品の発注状況と納入予定管理</p>
    </div>

    <!-- 発注一覧 -->
    <div class="card">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 class="text-lg font-medium text-gray-900">発注一覧</h2>
        
        <!-- フィルター -->
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div class="min-w-0 flex-1 sm:flex-none">
            <select v-model="filterStatus" class="form-input-sm w-full sm:w-auto">
              <option value="">全ての状態</option>
              <option value="ordered">発注済み</option>
              <option value="shipped">出荷済み</option>
              <option value="delivered">納入済み</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div class="min-w-0 flex-1 sm:flex-none">
            <input 
              v-model="filterPartName" 
              type="text" 
              placeholder="部品名で検索..." 
              class="form-input-sm w-full sm:w-auto"
            />
          </div>
          <div class="min-w-0 flex-1 sm:flex-none">
            <select v-model="sortBy" class="form-input-sm w-full sm:w-auto">
              <option value="order_date_desc">発注日（新しい順）</option>
              <option value="order_date_asc">発注日（古い順）</option>
              <option value="delivery_date_asc">納期（早い順）</option>
              <option value="delivery_date_desc">納期（遅い順）</option>
              <option value="part_name_asc">部品名（昇順）</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 件数表示 -->
      <div class="mb-4 text-sm text-gray-600">
        全{{ orders.length }}件中 {{ filteredOrders.length }}件を表示
        <span v-if="filterStatus || filterPartName" class="text-blue-600">
          （フィルター適用中）
        </span>
      </div>
      
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
            <tr v-for="order in filteredOrders" :key="order.id">
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
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button 
                  v-if="order.status !== 'delivered'"
                  @click="deliverOrder(order)" 
                  class="btn-success text-xs px-3 py-1"
                >
                  納入
                </button>
                <button @click="updateOrderStatus(order)" class="btn-primary text-xs px-3 py-1">
                  状態変更
                </button>
                <button 
                  @click="deleteOrder(order)" 
                  :disabled="order.status === 'delivered'"
                  class="btn-danger text-xs px-3 py-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  削除
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
          発注状態変更 - {{ selectedOrder?.part_name }}
        </h3>
        <form @submit.prevent="submitStatusUpdate">
          <div class="space-y-4">
            <div>
              <label class="form-label">状態</label>
              <select v-model="statusForm.status" class="form-input" required>
                <option value="ordered">発注済み</option>
                <option value="shipped">出荷済み</option>
                <option value="cancelled">キャンセル</option>
              </select>
              <p class="text-sm text-gray-600 mt-2">
                ※ 納入処理は「納入」ボタンを使用してください
              </p>
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

// フィルター用の変数
const filterStatus = ref('')
const filterPartName = ref('')
const sortBy = ref('order_date_desc')

const statusForm = ref({
  status: '' as 'ordered' | 'shipped' | 'delivered' | 'cancelled',
  expected_delivery_date: '',
})

// フィルタリングされた発注一覧
const filteredOrders = computed(() => {
  let filtered = orders.value

  // 状態でフィルター
  if (filterStatus.value) {
    filtered = filtered.filter(order => order.status === filterStatus.value)
  }

  // 部品名でフィルター
  if (filterPartName.value) {
    filtered = filtered.filter(order => 
      order.part_name?.toLowerCase().includes(filterPartName.value.toLowerCase())
    )
  }

  // ソート
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'order_date_asc':
        return a.order_date.localeCompare(b.order_date)
      case 'order_date_desc':
        return b.order_date.localeCompare(a.order_date)
      case 'delivery_date_asc':
        return (a.expected_delivery_date || '9999-12-31').localeCompare(b.expected_delivery_date || '9999-12-31')
      case 'delivery_date_desc':
        return (b.expected_delivery_date || '0000-01-01').localeCompare(a.expected_delivery_date || '0000-01-01')
      case 'part_name_asc':
        return (a.part_name || '').localeCompare(b.part_name || '')
      default:
        return b.order_date.localeCompare(a.order_date)
    }
  })

  return filtered
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

const deliverOrder = async (order: PartOrder) => {
  const confirmMessage = `発注を納入完了にしますか？\n\n部品: ${order.part_name}\n数量: ${order.quantity}個\n\n※ 在庫が自動的に更新され、入荷記録も作成されます`
  if (!confirm(confirmMessage)) return

  try {
    await ordersApi.deliver(order.id)
    await fetchOrders()
  } catch (error) {
    console.error('Failed to deliver order:', error)
    alert('納入処理に失敗しました')
  }
}

const deleteOrder = async (order: PartOrder) => {
  if (order.status === 'delivered') {
    alert('納入済みの発注は削除できません')
    return
  }
  
  const confirmMessage = `発注を削除しますか？\n部品: ${order.part_name}\n数量: ${order.quantity}個`
  if (!confirm(confirmMessage)) return

  try {
    await ordersApi.delete(order.id)
    await fetchOrders()
  } catch (error) {
    console.error('Failed to delete order:', error)
    alert('発注の削除に失敗しました')
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