<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">商品管理</h1>
        <p class="mt-1 text-sm text-gray-600">商品の管理とレシピ設定</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        新規商品追加
      </button>
    </div>

    <!-- 商品一覧 -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                現在在庫
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売価格
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                製造可能数
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="product in sortedProducts" :key="product.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ product.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ product.current_stock }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="product.selling_price">¥{{ product.selling_price.toLocaleString() }}</span>
                <span v-else class="text-gray-400">未設定</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="manufacturingCapacities[product.id] !== undefined">
                  {{ manufacturingCapacities[product.id] }}
                </span>
                <span v-else class="text-gray-400">計算中...</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                <button @click="openRecipeModal(product)" class="btn-primary text-xs px-2 py-1">
                  レシピ
                </button>
                <button @click="openManufactureModal(product)" class="btn-success text-xs px-2 py-1">
                  製造
                </button>
                <button @click="openSellModal(product)" class="text-xs px-2 py-1 bg-purple-600 text-white hover:bg-purple-700 rounded-md">
                  販売
                </button>
                <button @click="editProduct(product)" class="btn-secondary text-xs px-2 py-1">
                  編集
                </button>
                <button @click="deleteProduct(product.id)" class="btn-danger text-xs px-2 py-1">
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
          {{ editingProduct ? '商品編集' : '新規商品追加' }}
        </h3>
        <form @submit.prevent="submitProduct">
          <div class="space-y-4">
            <div>
              <label class="form-label">商品名 *</label>
              <input v-model="productForm.name" type="text" required class="form-input" />
            </div>
            <div>
              <label class="form-label">販売価格</label>
              <input v-model.number="productForm.selling_price" type="number" step="0.01" min="0" class="form-input" />
            </div>
            <div>
              <label class="form-label">現在在庫</label>
              <input v-model.number="productForm.current_stock" type="number" min="0" class="form-input" />
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-primary flex-1">
              {{ editingProduct ? '更新' : '作成' }}
            </button>
            <button type="button" @click="closeModals" class="btn-secondary flex-1">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- レシピ設定モーダル -->
    <div v-if="showRecipeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          レシピ設定 - {{ selectedProduct?.name }}
        </h3>
        <div class="space-y-4">
          <div v-for="(recipe, index) in recipeForm" :key="index" class="flex items-center space-x-4 p-4 border rounded">
            <div class="flex-1">
              <label class="form-label">部品</label>
              <select v-model="recipe.part_id" class="form-input" required>
                <option value="">部品を選択</option>
                <option v-for="part in sortedParts" :key="part.id" :value="part.id">
                  {{ part.name }} (在庫: {{ part.current_stock }})
                </option>
              </select>
            </div>
            <div class="w-32">
              <label class="form-label">必要数</label>
              <input v-model.number="recipe.quantity_required" type="number" min="1" required class="form-input" />
            </div>
            <button type="button" @click="removeRecipeItem(index)" class="text-red-600 hover:text-red-900">
              削除
            </button>
          </div>
          <button type="button" @click="addRecipeItem" class="btn-secondary">
            部品を追加
          </button>
        </div>
        <div class="mt-6 flex space-x-3">
          <button @click="submitRecipe" class="btn-primary flex-1">レシピ保存</button>
          <button type="button" @click="closeModals" class="btn-secondary flex-1">キャンセル</button>
        </div>
      </div>
    </div>

    <!-- 製造モーダル -->
    <div v-if="showManufactureModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">商品製造 - {{ selectedProduct?.name }}</h3>

        <!-- 製造可能数表示 -->
        <div v-if="selectedProductCapacity" class="mb-4 p-4 bg-blue-50 rounded">
          <p class="text-sm font-medium text-blue-900">最大製造可能数: {{ selectedProductCapacity.max_manufacturable }}個</p>
          <div v-if="selectedProductCapacity.limiting_parts.length > 0" class="mt-2">
            <p class="text-xs text-blue-700">制限要因:</p>
            <ul class="text-xs text-blue-600">
              <li v-for="part in selectedProductCapacity.limiting_parts" :key="part.part_name">
                {{ part.part_name }} (在庫: {{ part.current_stock }}, 必要: {{ part.required_per_product }}/個)
              </li>
            </ul>
          </div>
        </div>

        <form @submit.prevent="submitManufacture">
          <div class="space-y-4">
            <div>
              <label class="form-label">製造数量 *</label>
              <input
                v-model.number="manufactureForm.quantity"
                type="number"
                min="1"
                :max="selectedProductCapacity?.max_manufacturable"
                required
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">製造日 *</label>
              <input v-model="manufactureForm.manufacturing_date" type="date" required class="form-input" />
            </div>
            <div>
              <label class="form-label">備考</label>
              <textarea v-model="manufactureForm.notes" rows="3" class="form-input"></textarea>
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-success flex-1">製造実行</button>
            <button type="button" @click="closeModals" class="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 販売モーダル -->
    <div v-if="showSellModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold text-gray-900 mb-4">商品販売 - {{ selectedProduct?.name }}</h3>
        <form @submit.prevent="submitSale">
          <div class="space-y-4">
            <div>
              <label class="form-label">販売数量 *</label>
              <input
                v-model.number="saleForm.quantity"
                type="number"
                min="1"
                :max="selectedProduct?.current_stock"
                required
                class="form-input"
              />
              <p class="text-xs text-gray-500 mt-1">
                在庫: {{ selectedProduct?.current_stock }}個
              </p>
            </div>
            <div>
              <label class="form-label">販売単価 *</label>
              <input v-model.number="saleForm.unit_price" type="number" step="0.01" min="0" required class="form-input" />
            </div>
            <div>
              <label class="form-label">販売日 *</label>
              <input v-model="saleForm.sale_date" type="date" required class="form-input" />
            </div>
            <div>
              <label class="form-label">備考</label>
              <textarea v-model="saleForm.notes" rows="3" class="form-input"></textarea>
            </div>
          </div>
          <div class="mt-6 flex space-x-3">
            <button type="submit" class="btn-success flex-1">販売実行</button>
            <button type="button" @click="closeModals" class="btn-secondary flex-1">キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'
import { useProductsStore } from '@/stores/products'
import { usePartsStore } from '@/stores/parts'
import { manufacturingApi } from '@/services/api'
import type { Product, CreateProduct, CreateProductRecipe, CreateManufacturingRecord, CreateSalesRecord, ManufacturingCapacity } from '@/types'

const productsStore = useProductsStore()
const partsStore = usePartsStore()

const { products, sortedProducts } = storeToRefs(productsStore)
const { sortedParts } = storeToRefs(partsStore)

const manufacturingCapacities = ref<Record<number, number>>({})
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showRecipeModal = ref(false)
const showManufactureModal = ref(false)
const showSellModal = ref(false)
const editingProduct = ref<Product | null>(null)
const selectedProduct = ref<Product | null>(null)
const selectedProductCapacity = ref<ManufacturingCapacity | null>(null)

const productForm = ref<CreateProduct>({
  name: '',
  selling_price: undefined,
  current_stock: 0,
})

const recipeForm = ref<CreateProductRecipe[]>([])

const manufactureForm = ref<CreateManufacturingRecord>({
  quantity: 1,
  manufacturing_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
})

const saleForm = ref<CreateSalesRecord & { unit_price: number }>({
  quantity: 1,
  unit_price: 0,
  sale_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
})

const resetForm = () => {
  productForm.value = {
    name: '',
    selling_price: undefined,
    current_stock: 0,
  }
}

const editProduct = (product: Product) => {
  editingProduct.value = product
  productForm.value = {
    name: product.name,
    selling_price: product.selling_price,
    current_stock: product.current_stock,
  }
  showEditModal.value = true
}

const openRecipeModal = async (product: Product) => {
  selectedProduct.value = product
  try {
    const recipe = await productsStore.fetchProductRecipe(product.id)
    recipeForm.value = recipe.map(r => ({
      part_id: r.part_id,
      quantity_required: r.quantity_required,
    }))
  } catch (error) {
    recipeForm.value = []
  }
  showRecipeModal.value = true
}

const openManufactureModal = async (product: Product) => {
  selectedProduct.value = product
  try {
    const capacity = await productsStore.fetchManufacturingCapacity(product.id)
    selectedProductCapacity.value = capacity
  } catch (error) {
    selectedProductCapacity.value = null
  }
  manufactureForm.value = {
    quantity: 1,
    manufacturing_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  }
  showManufactureModal.value = true
}

const openSellModal = (product: Product) => {
  selectedProduct.value = product
  saleForm.value = {
    quantity: 1,
    unit_price: product.selling_price || 0,
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  }
  showSellModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  showRecipeModal.value = false
  showManufactureModal.value = false
  showSellModal.value = false
  editingProduct.value = null
  selectedProduct.value = null
  selectedProductCapacity.value = null
  resetForm()
}

const addRecipeItem = () => {
  recipeForm.value.push({
    part_id: 0,
    quantity_required: 1,
  })
}

const removeRecipeItem = (index: number) => {
  recipeForm.value.splice(index, 1)
}

const submitProduct = async () => {
  try {
    if (editingProduct.value) {
      await productsStore.updateProduct(editingProduct.value.id, productForm.value)
    } else {
      await productsStore.createProduct(productForm.value)
    }
    closeModals()
    await fetchManufacturingCapacities()
  } catch (error) {
    console.error('Failed to save product:', error)
  }
}

const submitRecipe = async () => {
  if (!selectedProduct.value) return

  try {
    const validRecipes = recipeForm.value.filter(r => r.part_id > 0)
    await productsStore.setProductRecipe(selectedProduct.value.id, validRecipes)
    closeModals()
    await fetchManufacturingCapacities()
  } catch (error) {
    console.error('Failed to save recipe:', error)
  }
}

const submitManufacture = async () => {
  if (!selectedProduct.value) return

  try {
    await manufacturingApi.manufacture(selectedProduct.value.id, manufactureForm.value)
    await productsStore.fetchProducts()
    await partsStore.fetchParts()
    closeModals()
    await fetchManufacturingCapacities()
  } catch (error) {
    console.error('Failed to manufacture product:', error)
  }
}

const submitSale = async () => {
  if (!selectedProduct.value) return

  try {
    await productsStore.sellProduct(selectedProduct.value.id, saleForm.value)
    closeModals()
  } catch (error) {
    console.error('Failed to sell product:', error)
  }
}

const deleteProduct = async (id: number) => {
  if (confirm('この商品を削除しますか？')) {
    try {
      await productsStore.deleteProduct(id)
      await fetchManufacturingCapacities()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
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

onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts(),
    partsStore.fetchParts(),
  ])
  await fetchManufacturingCapacities()
})
</script>
