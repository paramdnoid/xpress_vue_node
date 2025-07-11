<template>
  <DefaultLayout>
    <div class="page-body m-0">
      <div class="verti-dash-content">
        <SidebarToggle />
        <div class="vr bg-gray-300 opacity-50 m-2"></div>
        <Breadcrumb />
        <div class="ms-auto view-mode">
          <iconify-icon @click="viewMode = 'table'"
            :class="[viewMode === 'table' ? 'text-primary' : 'text-primary opacity-50']"
            icon="material-symbols:event-list-outline-sharp" width="24" height="24"></iconify-icon>
          <iconify-icon @click="viewMode = 'grid'"
            :class="[viewMode === 'grid' ? 'text-primary' : 'text-primary opacity-50']" icon="material-symbols:grid-on"
            width="24" height="24"></iconify-icon>
          <div class="ms-2 text-primary text-nowrap small mt-1">
            Total: {{ totalSize }}
          </div>
        </div>

      </div>
      <div class="d-flex flex-fill position-relative">
        <div class="position-absolute top-0 end-0 start-0 bottom-0 overflow-hidden">
          <div class="d-flex h-100">
            <aside :class="['sidebar', { open: isSidebarOpen }]">
              <div class="col-docs">
                <div class="py-3">
                  <div class="space-y space-y-5">
                    <div class="flex-fill">
                      <nav class="space-y space-y-5" id="menu">
                        <slot name="sidebar" />
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
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
import axios from '@/axios'
import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import DefaultLayout from './DefaultLayout.vue'
import SidebarToggle from '@/components/SidebarToggle.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

const viewMode = ref('table')
provide('viewMode', viewMode)
const isSidebarOpen = ref(true)
const isWide = ref(window.innerWidth >= 768)
const totalSize = ref('')

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
  axios.get('/files/total-size')
    .then(res => {
      totalSize.value = res.data.size
    })
    .catch(() => {
      totalSize.value = '—'
    })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSidebarState)
})
</script>

<style>
.verti-dash-content {
  height: 32px;
  width: 100%;
  display: flex;
  align-items: center;
  padding-right: calc(var(--tblr-gutter-x) * 0.6);
  padding-left: calc(var(--tblr-gutter-x) * 0.3);
  background: var(--tblr-primary);
}

.view-mode {
  width: auto;
  height: 24px;
  display: flex;
  justify-content: center;
  justify-items: center;
  background-color: rgba(255, 255, 255, .8);
  border-radius: 5px;
  padding-right: 5px;
}

.sidebar {
  width: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--tblr-gray-100);
  border-right: 1px solid var(--tblr-gray-300);
  position: relative;
  overflow-y: auto;
  height: 100%;
  transition: min-width 0.3s ease, width 0.3s ease;
  min-width: 0px;
}

.sidebar.open {
  min-width: 100%;
  width: 320px;
}

.content {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 10px 5px 25px;
}

@media (min-width: 576px) {
  .sidebar.open {
    min-width: 320px;
  }
}
</style>