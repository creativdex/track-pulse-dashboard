import type { TableRowItem } from '../composables/useWorkloadTable';

export function useWorkloadFormatting() {
  function formatHours(hours: number | null | undefined): string {
    if (hours == null) return '—';
    return hours.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '—';
    return amount.toLocaleString(undefined, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
  }

  function calculateTotalHours(item: TableRowItem): number {
    if (item.children && item.children.length > 0) {
      return item.children.reduce((sum, child) => sum + calculateTotalHours(child), 0);
    }
    return item.hoursSpent || 0;
  }

  function calculateTotalAmount(item: TableRowItem): number {
    if (item.children && item.children.length > 0) {
      return item.children.reduce((sum, child) => sum + calculateTotalAmount(child), 0);
    }
    return item.amount || 0;
  }

  return {
    formatHours,
    formatCurrency,
    calculateTotalHours,
    calculateTotalAmount,
  };
}
