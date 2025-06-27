import { ref } from 'vue';
import type { IWorkloadTask } from '../schemas/workloadSchema';

export function useWorklogSelection() {
  const selectedTask = ref<IWorkloadTask | null>(null);

  function hasWorklogsInTaskTree(task: IWorkloadTask, allTasks: IWorkloadTask[]): boolean {
    // Если это псевдо-задача проекта, проверяем ворклоги всех задач проекта
    if (task.description?.includes('Все ворклоги проекта:')) {
      const projectTasks = allTasks.filter((t) => t.projectId === task.key);
      return projectTasks.some((projectTask) => hasWorklogsInTaskTree(projectTask, allTasks));
    }
    // Проверяем саму задачу
    if (task.worklogs && task.worklogs.length > 0) {
      return true;
    }
    // Проверяем дочерние задачи
    const childTasks = allTasks.filter((t) => t.parentKey === task.key);
    return childTasks.some((childTask) => hasWorklogsInTaskTree(childTask, allTasks));
  }

  function handleTaskSelect(task: IWorkloadTask) {
    if (selectedTask.value && selectedTask.value.key === task.key) {
      selectedTask.value = null;
    } else {
      selectedTask.value = task;
    }
  }

  function clearSelection() {
    selectedTask.value = null;
  }

  return {
    selectedTask,
    hasWorklogsInTaskTree,
    handleTaskSelect,
    clearSelection,
  };
}
