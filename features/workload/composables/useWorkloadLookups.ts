import { computed, type Ref } from "vue";
import type { IWorkloadItem } from "../schemas/workloadSchema";
import type { StandartColor } from "../types/colors";

export function useWorkloadLookups(
  statuses: Ref<IWorkloadItem[]>,
  assignees: Ref<IWorkloadItem[]>,
  types: Ref<IWorkloadItem[]>
) {
  // Создаем карты для быстрого поиска
  const statusMap = computed(() =>
    Object.fromEntries((statuses.value || []).map((s) => [s.key, s.display]))
  );

  const assigneeMap = computed(() =>
    Object.fromEntries((assignees.value || []).map((a) => [a.key, a.display]))
  );

  const typeMap = computed(() =>
    Object.fromEntries((types.value || []).map((t) => [t.key, t.display]))
  );

  // Функции для получения отображаемых значений
  function getStatusDisplay(statusKey: string): string {
    return statusMap.value[statusKey] || statusKey;
  }

  function getAssigneeDisplay(assigneeId: string | null): string {
    if (!assigneeId) return "—";
    return assigneeMap.value[assigneeId] || assigneeId;
  }

  function getTypeDisplay(typeKey: string): string {
    return typeMap.value[typeKey] || typeKey;
  }

  // Функции для получения цветов бейджей
  function getStatusColor(
    statusKey: string
  ):
    | "neutral"
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "error" {
    switch (statusKey.toLowerCase()) {
      case "open":
      case "new":
        return "neutral";
      case "in_progress":
      case "reopened":
        return "info";
      case "resolved":
      case "closed":
      case "done":
        return "success";
      case "blocked":
      case "rejected":
        return "error";
      default:
        return "neutral";
    }
  }

  function getStandartTypeColor(
    typeKey: string
  ): StandartColor {
    switch (typeKey.toLowerCase()) {
      case "story":
      case "feature":
        return "info";
      case "task":
        return "success";
      case "bug":
        return "error";
      case "subtask":
        return "warning";
      case "project":
        return "primary";
      default:
        return "neutral";
    }
  }

  function getCustomTypeColor(
    typeKey: string
  ): string {
    switch (typeKey.toLowerCase()) {
      case "epic":
        return "badge-epic";
      // Добавьте другие кастомные типы, если нужно
      default:
        return "";
    }
  }

  function getTypeColor(typeKey: string): { color: StandartColor; customClass: string } {
    const customClass = getCustomTypeColor(typeKey);
    if (customClass) {
      return { color: "neutral", customClass };
    }
    return { color: getStandartTypeColor(typeKey), customClass: "" };
  }

  return {
    statusMap,
    assigneeMap,
    typeMap,
    getStatusDisplay,
    getAssigneeDisplay,
    getTypeDisplay,
    getStatusColor,
    getTypeColor,
  };
}
