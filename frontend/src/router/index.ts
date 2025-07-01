import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Parts from '@/views/Parts.vue'
import Products from '@/views/Products.vue'
import Manufacturing from '@/views/Manufacturing.vue'
import Sales from '@/views/Sales.vue'
import Orders from '@/views/Orders.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/parts',
      name: 'parts',
      component: Parts
    },
    {
      path: '/products',
      name: 'products',
      component: Products
    },
    {
      path: '/manufacturing',
      name: 'manufacturing',
      component: Manufacturing
    },
    {
      path: '/sales',
      name: 'sales',
      component: Sales
    },
    {
      path: '/orders',
      name: 'orders',
      component: Orders
    }
  ]
})

export default router
