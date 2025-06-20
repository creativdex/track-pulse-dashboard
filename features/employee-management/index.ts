// Экспорт компонентов
export { default as EmployeeManagement } from './ui/EmployeeManagement.vue';

// Экспорт store
export { useEmployeeStore } from './stores/useEmployeeStore';

// Экспорт API
export * from './api/client';

// Экспорт схем и типов
export * from './schemas/employeeSchema';
