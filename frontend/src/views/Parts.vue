<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">部品管理</h1>
        <p class="mt-1 text-sm text-gray-600">部品の在庫管理と発注管理</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        新規部品追加
      </button>
    </div>

    <!-- 検索とフィルタ -->
    <div class="card">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label for="search" class="form-label">検索</label>
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            placeholder="部品名で検索..."
            class="form-input"
          />
        </div>
        <div>
          <label for="filter" class="form-label">フィルタ</label>
          <select id="filter" v-model="stockFilter" class="form-input">
            <option value="">すべて</option>
            <option value="low">在庫不足</option>
            <option value="zero">在庫なし</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary">
            フィルタリセット
          </button>
        </div>
      </div>
    </div>

    <!-- 部品一覧 -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                部品名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                現在在庫
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最小在庫数
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                単価
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
            <tr v-for="part in filteredParts" :key="part.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ part.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ part.current_stock }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ part.min_stock_alert }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="part.unit_price">¥{{ part.unit_price.toLocaleString() }}</span>
                <span v-else class="text-gray-400">未設定</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStockStatusClass(part)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStockStatus(part) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button @click="openStockModal(part)" class="btn-primary text-xs px-3 py-1">
                  入荷
                </button>
                <button @click="openOrderModal(part)" class="btn-success text-xs px-3 py-1">
                  発注
                </button>
                <button @click="editPart(part)" class="btn-secondary text-xs px-3 py-1">
                  編集
                </button>
                <button @click="deletePart(part.id)" class="btn-danger text-xs px-3 py-1">
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新規作成/編集モーダル -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          {{ editingPart ? '部品編集' : '新規部品追加' }}
        </h3>
        <form @submit.prevent="submitPart">
          <div class="space-y-4">
            <div>
              <label class="form-label">部品名 *</label>
              <input v-model="partForm.name" type="text" required class="form-input" />
            </div>
            <div>
              <label class="form-label">単価</label>
              <input v-model.number="partForm.unit_price" type="number" step="0.01" min="0" class="form-input" />
            </div>
            <div>
              <label class="form-label">現在在庫</label>
              <input v-model.number="partForm.current_stock" type="number" min="0" class="form-input" />
            </div>
            <div>
              <label class="form-label">最小在庫数</label>
              <input v-model.number="partForm.min_stock_alert" type="number" min="0" class="form-input" />
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-primary flex-1">
              {{ editingPart ? '更新' : '作成' }}
            </button>
            <button type="button" @click="closeModals" class="btn-secondary flex-1">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 在庫入荷モーダル -->
    <div v-if="showStockModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">在庫入荷 - {{ selectedPart?.name }}</h3>
        <form @submit.prevent="submitStock">
          <div class="space-y-4">
            <div>
              <label class="form-label">入荷数量 *</label>
              <input v-model.number="stockForm.quantity" type="number" min="1" required class="form-input" />
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-blue-900 mb-2">自動設定項目:</h4>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• 入荷日: 今日（{{ new Date().toLocaleDateString('ja-JP') }}）</li>
                <li>• 単価: 部品登録時の単価（¥{{ selectedPart?.unit_price?.toLocaleString() || '未設定' }}）</li>
              </ul>
            </div>
            <div>
              <label class="form-label">備考</label>
              <textarea v-model="stockForm.notes" rows="3" class="form-input" placeholder="入荷に関する備考があれば入力してください"></textarea>
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-primary flex-1">入荷登録</button>
            <button type="button" @click="closeModals" class="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 発注モーダル -->
    <div v-if="showOrderModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">部品発注 - {{ selectedPart?.name }}</h3>
        <form @submit.prevent="submitOrder">
          <div class="space-y-4">
            <div>
              <label class="form-label">発注数量 *</label>
              <input v-model.number="orderForm.quantity" type="number" min="1" required class="form-input" />
            </div>
            <div>
              <label class="form-label">発注日 *</label>
              <input v-model="orderForm.order_date" type="date" required class="form-input" />
            </div>
            <div>
              <label class="form-label">納入予定日</label>
              <input v-model="orderForm.expected_delivery_date" type="date" class="form-input" />
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-primary flex-1">発注</button>
            <button type="button" @click="closeModals" class="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'
import { usePartsStore } from '@/stores/parts'
import type { Part, CreatePart, CreatePartOrder } from '@/types'

const partsStore = usePartsStore()
const { parts } = storeToRefs(partsStore)

const searchQuery = ref('')
const stockFilter = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showStockModal = ref(false)
const showOrderModal = ref(false)
const editingPart = ref<Part | null>(null)
const selectedPart = ref<Part | null>(null)

const partForm = ref<CreatePart>({
  name: '',
  unit_price: undefined,
  current_stock: 0,
  min_stock_alert: 0,
})

const stockForm = ref({
  quantity: 1,
  notes: '',
})

const orderForm = ref<CreatePartOrder>({
  quantity: 1,
  order_date: format(new Date(), 'yyyy-MM-dd'),
  expected_delivery_date: undefined,
})

const filteredParts = computed(() => {
  let filtered = parts.value

  if (searchQuery.value) {
    filtered = filtered.filter(part =>
      part.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (stockFilter.value === 'low') {
    filtered = filtered.filter(part => part.current_stock <= part.min_stock_alert)
  } else if (stockFilter.value === 'zero') {
    filtered = filtered.filter(part => part.current_stock === 0)
  }

  return filtered
})

const getStockStatus = (part: Part) => {
  if (part.current_stock === 0) return '在庫なし'
  if (part.current_stock <= part.min_stock_alert) return '在庫不足'
  return '在庫あり'
}

const getStockStatusClass = (part: Part) => {
  if (part.current_stock === 0) return 'bg-red-100 text-red-800'
  if (part.current_stock <= part.min_stock_alert) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

const resetForm = () => {
  partForm.value = {
    name: '',
    unit_price: undefined,
    current_stock: 0,
    min_stock_alert: 0,
  }
  stockForm.value = {
    quantity: 1,
    notes: '',
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  stockFilter.value = ''
}

const editPart = (part: Part) => {
  editingPart.value = part
  partForm.value = {
    name: part.name,
    unit_price: part.unit_price,
    current_stock: part.current_stock,
    min_stock_alert: part.min_stock_alert,
  }
  showEditModal.value = true
}

const openStockModal = (part: Part) => {
  selectedPart.value = part
  stockForm.value = {
    quantity: 1,
    notes: '',
  }
  showStockModal.value = true
}

const openOrderModal = (part: Part) => {
  selectedPart.value = part
  orderForm.value = {
    quantity: 1,
    order_date: format(new Date(), 'yyyy-MM-dd'),
    expected_delivery_date: undefined,
  }
  showOrderModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  showStockModal.value = false
  showOrderModal.value = false
  editingPart.value = null
  selectedPart.value = null
  resetForm()
}

const submitPart = async () => {
  try {
    if (editingPart.value) {
      await partsStore.updatePart(editingPart.value.id, partForm.value)
    } else {
      await partsStore.createPart(partForm.value)
    }
    closeModals()
  } catch (error) {
    console.error('Failed to save part:', error)
  }
}

const submitStock = async () => {
  if (!selectedPart.value) return

  try {
    await partsStore.addStock(selectedPart.value.id, stockForm.value)
    closeModals()
  } catch (error) {
    console.error('Failed to add stock:', error)
  }
}

const submitOrder = async () => {
  if (!selectedPart.value) return

  try {
    await partsStore.createOrder(selectedPart.value.id, orderForm.value)
    closeModals()
  } catch (error) {
    console.error('Failed to create order:', error)
  }
}

const deletePart = async (id: number) => {
  if (confirm('この部品を削除しますか？')) {
    try {
      await partsStore.deletePart(id)
    } catch (error) {
      console.error('Failed to delete part:', error)
    }
  }
}

onMounted(() => {
  partsStore.fetchParts()
})
</script>
