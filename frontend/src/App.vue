<template>
  <div class="min-h-full">
    <nav class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <router-link to="/" class="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                ざいかん！
              </router-link>
            </div>
            <!-- Desktop navigation -->
            <div class="hidden md:ml-10 md:flex md:items-baseline md:space-x-4">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.to"
                class="nav-link text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-100"
                :class="{ 'bg-gray-100 text-gray-900 shadow-sm': $route.path.startsWith(item.to) }"
              >
                {{ item.name }}
              </router-link>
            </div>
          </div>
          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Bars3Icon v-if="!mobileMenuOpen" class="block h-6 w-6" />
              <XMarkIcon v-else class="block h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Mobile menu -->
      <Transition name="slide-up">
        <div v-show="mobileMenuOpen" class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            @click="mobileMenuOpen = false"
            class="nav-link text-gray-500 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-gray-100"
            :class="{ 'bg-gray-100 text-gray-900 shadow-sm': $route.path.startsWith(item.to) }"
          >
            {{ item.name }}
          </router-link>
          </div>
        </div>
      </Transition>
    </nav>

    <main class="py-10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const mobileMenuOpen = ref(false)

const navigation = [
  { name: 'ダッシュボード', to: '/' },
  { name: '部品管理', to: '/parts' },
  { name: '商品管理', to: '/products' },
  { name: '製造計画', to: '/manufacturing' },
  { name: '販売管理', to: '/sales' },
  { name: '発注管理', to: '/orders' },
]
</script>