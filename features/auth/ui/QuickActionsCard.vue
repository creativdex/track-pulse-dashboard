<template>
  <UCard class="mt-6">
    <template #header>
      <h3 class="text-lg font-semibold">Быстрые действия</h3>
    </template>

    <div class="space-y-3">
      <UButton
        color="primary"
        variant="outline"
        block
        icon="i-heroicons-key"
        @click="showPasswordModal = true"
      >
        Сменить пароль
      </UButton>
      
      <UButton
        color="error"
        variant="outline"
        block
        icon="i-heroicons-trash"
        @click="$emit('delete-account')"
      >
        Удалить аккаунт
      </UButton>
    </div>

    <!-- Модалка смены пароля -->
    <PasswordChangeModal v-model:open="showPasswordModal" />
  </UCard>
</template>

<script setup lang="ts">
import PasswordChangeModal from './PasswordChangeModal.vue';

interface Emits {
  (e: 'delete-account'): void;
}

defineEmits<Emits>();

const showPasswordModal = ref(false);
</script>
