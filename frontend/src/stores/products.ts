import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productsApi, manufacturingApi } from '@/services/api'
import type { Product, CreateProduct, ProductRecipe, CreateProductRecipe, CreateSalesRecord, ManufacturingCapacity } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProductRecipe = ref<ProductRecipe[]>([])
  const manufacturingCapacity = ref<ManufacturingCapacity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedProducts = computed(() => 
    [...products.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const getProductById = computed(() => (id: number) => 
    products.value.find(product => product.id === id)
  )

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.getAll()
      products.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch products'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProduct(data: CreateProduct) {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.create(data)
      products.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id: number, data: Partial<CreateProduct>) {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.update(id, data)
      const index = products.value.findIndex(product => product.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id: number) {
    loading.value = true
    error.value = null
    try {
      await productsApi.delete(id)
      products.value = products.value.filter(product => product.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchProductRecipe(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.getRecipe(id)
      currentProductRecipe.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch product recipe'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setProductRecipe(id: number, recipes: CreateProductRecipe[]) {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.setRecipe(id, recipes)
      currentProductRecipe.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to set product recipe'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sellProduct(id: number, data: CreateSalesRecord & { unit_price: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.sell(id, data)
      const index = products.value.findIndex(product => product.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to sell product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function copyProduct(id: number, name: string) {
    loading.value = true
    error.value = null
    try {
      const response = await productsApi.copy(id, name)
      products.value.push(response.data.product)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to copy product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchManufacturingCapacity(productId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await manufacturingApi.getCapacity(productId)
      manufacturingCapacity.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch manufacturing capacity'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    currentProductRecipe,
    manufacturingCapacity,
    loading,
    error,
    sortedProducts,
    getProductById,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProductRecipe,
    setProductRecipe,
    sellProduct,
    copyProduct,
    fetchManufacturingCapacity,
  }
})