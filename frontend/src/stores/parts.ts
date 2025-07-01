import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { partsApi, stockEntriesApi } from '@/services/api'
import type { Part, CreatePart, StockEntry, CreateStockEntry, CreatePartOrder } from '@/types'

export const usePartsStore = defineStore('parts', () => {
  const parts = ref<Part[]>([])
  const lowStockParts = ref<Part[]>([])
  const stockEntries = ref<StockEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedParts = computed(() => 
    [...parts.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const getPartById = computed(() => (id: number) => 
    parts.value.find(part => part.id === id)
  )

  async function fetchParts() {
    loading.value = true
    error.value = null
    try {
      const response = await partsApi.getAll()
      parts.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch parts'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchLowStockParts() {
    try {
      const response = await partsApi.getLowStock()
      lowStockParts.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch low stock parts'
      throw err
    }
  }

  async function createPart(data: CreatePart) {
    loading.value = true
    error.value = null
    try {
      const response = await partsApi.create(data)
      parts.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create part'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePart(id: number, data: Partial<CreatePart>) {
    loading.value = true
    error.value = null
    try {
      const response = await partsApi.update(id, data)
      const index = parts.value.findIndex(part => part.id === id)
      if (index !== -1) {
        parts.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update part'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePart(id: number) {
    loading.value = true
    error.value = null
    try {
      await partsApi.delete(id)
      parts.value = parts.value.filter(part => part.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete part'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addStock(id: number, data: CreateStockEntry) {
    loading.value = true
    error.value = null
    try {
      const response = await partsApi.addStock(id, data)
      const index = parts.value.findIndex(part => part.id === id)
      if (index !== -1) {
        parts.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to add stock'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createOrder(id: number, data: CreatePartOrder) {
    loading.value = true
    error.value = null
    try {
      const response = await partsApi.createOrder(id, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create order'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStockEntries() {
    try {
      const response = await stockEntriesApi.getAll()
      stockEntries.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch stock entries'
      throw err
    }
  }

  return {
    parts,
    lowStockParts,
    stockEntries,
    loading,
    error,
    sortedParts,
    getPartById,
    fetchParts,
    fetchLowStockParts,
    createPart,
    updatePart,
    deletePart,
    addStock,
    createOrder,
    fetchStockEntries,
  }
})