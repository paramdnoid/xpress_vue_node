<template>
  <SidebarLayout>
    <template #sidebar>
      <div class="col-docs">
        <div class="py-3">
          <div class="space-y space-y-5">
            <div class="flex-fill">
              <nav class="space-y space-y-5" id="menu">
                <div>
                  <div class="subheader mb-2 px-3 fw-bolder">
                    Navigation
                  </div>
                  <nav class="nav nav-vertical px-2">
                    
                  </nav>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div>

      </div>
    </template>
  </SidebarLayout>
</template>

<script setup>
import SidebarLayout from '@/layouts/SidebarLayout.vue'
</script>