<template>
  <DefaultLayout>
    <div class="page-body m-0">
      <div class="verti-dash-content">
        <SidebarToggle />
        <div class="input-group input-group-sm me-3" style="max-width: 260px;">
          <span class="input-group-text bg-transparent border-0 text-light px-2">
            <iconify-icon icon="material-symbols:search" width="18" height="18" />
          </span>
          <input type="search" v-model="searchQuery" class="form-control form-control-sm bg-transparent text-light border-0" placeholder="Search..." />
        </div>
        <Breadcrumb />
        <div class="ms-auto view-mode">
          <iconify-icon @click="viewMode = 'table'"
            :class="[viewMode === 'table' ? 'text-light' : 'text-light opacity-50']"
            icon="material-symbols:event-list-outline-sharp" width="20" height="20"></iconify-icon>
          <iconify-icon @click="viewMode = 'grid'"
            :class="[viewMode === 'grid' ? 'text-light' : 'text-light opacity-50']" icon="material-symbols:grid-on"
            width="20" height="20"></iconify-icon>
          <div class="ms-2 text-light text-nowrap mt-1">
            {{ totalSize }}
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
const searchQuery = ref('')

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
  border-top: 1px solid rgba(255, 255, 255, .15);
  background: var(--tblr-primary);
}

.view-mode {
  width: auto;
  height: 24px;
  display: flex;
  justify-content: center;
  justify-items: center;
  padding: 0 5px;
  font-size: .8rem;
}

.view-mode iconify-icon {
  padding-top: 3px;
  width: 20px !important;
  height: 20px !important;
  margin: 0 5px;

  &:hover {
    cursor: pointer;
    opacity: .8;
  }
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


.form-control.form-control-sm {
  background-color: transparent;
  color: var(--tblr-light);
  opacity: .7;
  font-size: .9rem !important;
  border: 0;
}

.form-control.form-control-sm::placeholder {
  color: rgba(255,255,255, .5);
  font-size: .9rem;
}

@media (min-width: 576px) {
  .sidebar.open {
    min-width: 320px;
  }
}
</style>