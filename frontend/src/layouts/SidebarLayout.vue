<template>
  <DefaultLayout>
    <div class="page-body m-0">
      <div class="verti-dash-content">
        <SidebarToggle />
        <div class="input-group input-group-sm me-3 w-100">
          <span class="input-group-text bg-transparent border-0 text-light px-2">
            <iconify-icon icon="material-symbols:search" width="18" height="18" />
          </span>
          <input type="search" v-model="searchQuery" class="form-control form-control-sm bg-transparent text-light border-0" placeholder="Search..." />
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
import { ref, onMounted, provide } from 'vue'
import DefaultLayout from './DefaultLayout.vue'
import SidebarToggle from '@/components/SidebarToggle.vue'

const viewMode = ref('table')
provide('viewMode', viewMode)
const isSidebarOpen = ref(true)
const searchQuery = ref('')

const updateSidebarState = () => {
  isSidebarOpen.value = window.innerWidth >= 768
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
  padding: 10px 0;
}


.form-control.form-control-sm {
  background-color: transparent;
  color: var(--tblr-light);
  opacity: .7;
  font-size: .9rem !important;
  border: 0;
}

.form-control.form-control-sm::placeholder {
  color: rgba(255,255,255, .8);
  font-style: italic;
  font-size: .9rem;
}

@media (min-width: 576px) {
  .sidebar.open {
    min-width: 320px;
  }
}
</style>