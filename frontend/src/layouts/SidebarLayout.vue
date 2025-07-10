<template>
  <DefaultLayout>
    <div class="page-body m-0">

      <div class="verti-dash-content">
        <SidebarToggle />
      </div>
      <div class="d-flex flex-fill position-relative">
        <div class="position-absolute top-0 end-0 start-0 bottom-0 overflow-hidden">
          <div class="d-flex h-100">
            <aside :class="['sidebar', { open: isSidebarOpen }]">
              <slot name="sidebar" />
            </aside>
            <main class="content">
              <slot name="content" />
            </main>

          </div>

        </div>

      </div>

    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import DefaultLayout from './DefaultLayout.vue'
import SidebarToggle from '@/components/SidebarToggle.vue'

const isSidebarOpen = ref(true)
const isWide = ref(window.innerWidth >= 768)

const updateSidebarState = () => {
  const wide = window.innerWidth >= 768
  isWide.value = wide
  isSidebarOpen.value = wide
}

const toggleSidebarState = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

provide('toggleSidebarState', toggleSidebarState)
provide('isSidebarOpen', isSidebarOpen)

onMounted(() => {
  updateSidebarState()
  window.addEventListener('resize', updateSidebarState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSidebarState)
})
</script>

<style>
.sidebar {
  min-width: 300px;
  display: none;
  flex-direction: column;
  background-color: var(--tblr-gray-100);
  border-right: 1px solid var(--tblr-gray-300);
  position: relative;
  overflow-y: auto;
  height: 100%;
}

.sidebar.open {
  display: flex;
}

.content {
  width: 100%;
  display: flex;
  flex-direction: column;
}


@media (min-width: 576px) {}
</style>