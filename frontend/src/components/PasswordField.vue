<template>
    <div class="form-floating form-floating-custom mb-3 auth-pass-inputgroup">
        <input :type="showPassword ? 'text' : 'password'" :value="password" @input="password = $event.target.value"
            name="password" class="form-control" id="input-password" :autocomplete="props.autocomplete">
        <button @click="togglePasswordVisibility" type="button"
            class="btn btn-link position-absolute h-100 end-0 top-0 p-0 m-0 text-muted password-hint">
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-eye">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-eye-off">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                <path
                    d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                <path d="M3 3l18 18" />
            </svg>
        </button>
        <label for="input-password">Passwort</label>
        <div class="form-floating-icon">
            <iconify-icon icon="bi:shield-lock" style="font-size: 24px"></iconify-icon>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: String,
  autocomplete: {
    type: String,
    default: 'off'
  }
});
const emit = defineEmits(['update:modelValue'])

const showPassword = ref(false)
const togglePasswordVisibility = () => (showPassword.value ^= true)

const password = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
})
</script>