import { computed, type Ref } from 'vue';
import type { IWorkloadTask, IWorkloadItem } from '../schemas/workloadSchema';

// Расширяем IWorkloadTask для вложенности
export interface WorkloadTaskWithChildren extends IWorkloadTask {
  children?: WorkloadTaskWithChildren[];
  level?: number;
  isExpanded?: boolean;
}

// Интерфейс для проектов в таблице
export interface ProjectWithTasks extends WorkloadTaskWithChildren {
  isProject: boolean;
  display: string;
}

// Общий тип для строк таблицы
export type TableRowItem = WorkloadTaskWithChildren | ProjectWithTasks;

export function useWorkloadTable(
  tasks: Ref<IWorkloadTask[]>,
  projects: Ref<IWorkloadItem[]>
) {
  // Построение иерархии задач с проектами на верхнем уровне
  function buildHierarchyWithProjects(taskList: IWorkloadTask[], projectList: IWorkloadItem[]): TableRowItem[] {
    console.log('🔧 buildHierarchyWithProjects called with:', { taskList, projectList });
    
    const taskMap = new Map<string, WorkloadTaskWithChildren>();
    const projectTasksMap = new Map<string, WorkloadTaskWithChildren[]>();
    
    // Создаем карту всех задач
    taskList.forEach((task) => {
      const taskWithChildren: WorkloadTaskWithChildren = {
        ...task,
        children: [],
        level: 1, // Задачи начинаются с уровня 1 (проекты на уровне 0)
        isExpanded: true,
      };
      taskMap.set(task.key, taskWithChildren);
      
      // Группируем задачи по проектам
      const projectId = task.projectId || 'no-project';
      if (!projectTasksMap.has(projectId)) {
        projectTasksMap.set(projectId, []);
      }
      projectTasksMap.get(projectId)!.push(taskWithChildren);
    });
    
    // Строим иерархию внутри каждого проекта
    taskMap.forEach((task) => {
      if (task.parentKey && taskMap.has(task.parentKey)) {
        const parent = taskMap.get(task.parentKey)!;
        parent.children!.push(task);
        task.level = (parent.level || 1) + 1;
        
        // Удаляем дочернюю задачу из корневого списка проекта
        const projectId = task.projectId || 'no-project';
        const projectTasks = projectTasksMap.get(projectId) || [];
        const index = projectTasks.findIndex(t => t.key === task.key);
        if (index > -1) {
          projectTasks.splice(index, 1);
        }
      }
    });
    
    // Создаем структуру с проектами
    const result: TableRowItem[] = [];
    
    projectList.forEach((project) => {
      const projectTasks = projectTasksMap.get(project.key) || [];
      
      if (projectTasks.length > 0) {
        // Создаем проект как корневой элемент
        const projectWithTasks: ProjectWithTasks = {
          key: project.key,
          display: project.display,
          summary: project.display,
          createdAt: new Date().toISOString(),
          hoursSpent: null,
          amount: null,
          statusKey: '',
          typeKey: 'project',
          assigneeId: null,
          projectId: null,
          sprintKey: null,
          parentKey: null,
          children: projectTasks,
          level: 0,
          isExpanded: true,
          isProject: true,
        };
        
        result.push(projectWithTasks);
      }
    });
    
    // Добавляем задачи без проекта (если есть)
    const orphanTasks = projectTasksMap.get('no-project') || [];
    if (orphanTasks.length > 0) {
      const noProjectGroup: ProjectWithTasks = {
        key: 'no-project',
        display: 'Без проекта',
        summary: 'Задачи без проекта',
        createdAt: new Date().toISOString(),
        hoursSpent: null,
        amount: null,
        statusKey: '',
        typeKey: 'project',
        assigneeId: null,
        projectId: null,
        sprintKey: null,
        parentKey: null,
        children: orphanTasks,
        level: 0,
        isExpanded: true,
        isProject: true,
      };
      
      result.push(noProjectGroup);
    }
    
    return result;
  }

  // Функция для развертывания иерархии в плоский список для таблицы
  function flattenHierarchy(items: TableRowItem[]): TableRowItem[] {
    const result: TableRowItem[] = [];
    
    function addItem(item: TableRowItem) {
      result.push(item);
      if (item.isExpanded && item.children) {
        item.children.forEach(addItem);
      }
    }
    
    items.forEach(addItem);
    return result;
  }

  // Суммирование часов по всем дочерним задачам
  function calculateTotalHours(item: TableRowItem): number {
    let total = item.hoursSpent || 0;
    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        total += calculateTotalHours(child);
      });
    }
    return total;
  }

  // Суммирование суммы по всем дочерним задачам
  function calculateTotalAmount(item: TableRowItem): number {
    let total = item.amount || 0;
    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        total += calculateTotalAmount(child);
      });
    }
    return total;
  }

  // Проверка наличия ворклогов у задачи или у любой дочерней задачи
  function hasWorklogsInTree(item: TableRowItem): boolean {
    // Проекты не имеют собственных ворклогов
    if ('isProject' in item && item.isProject) {
      // Проверяем дочерние задачи
      if (item.children && item.children.length > 0) {
        return item.children.some((child) => hasWorklogsInTree(child));
      }
      return false;
    }
    
    // Для обычных задач проверяем саму задачу
    if (item.worklogs && item.worklogs.length > 0) {
      return true;
    }
    
    // Проверяем дочерние задачи
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => hasWorklogsInTree(child));
    }
    
    return false;
  }

  // Форматирование часов
  function formatHours(hours: number | null): string {
    if (!hours) return "—";
    
    // Округляем до 1 знака после запятой
    const roundedHours = Math.round(hours * 10) / 10;
    
    const lastDigit = Math.floor(roundedHours) % 10;
    const lastTwoDigits = Math.floor(roundedHours) % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return `${roundedHours} час`;
    } else if (
      [2, 3, 4].includes(lastDigit) &&
      ![12, 13, 14].includes(lastTwoDigits)
    ) {
      return `${roundedHours} часа`;
    } else {
      return `${roundedHours} часов`;
    }
  }

  // Форматирование суммы
  function formatCurrency(amount: number | null): string {
    if (!amount) return "—";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Основная функция для получения иерархии
  const hierarchyTasks = computed(() => {
    console.log('🏗️ useWorkloadTable buildHierarchyWithProjects:', {
      tasksLength: tasks.value.length,
      projectsLength: projects.value.length,
      tasksData: tasks.value,
      projectsData: projects.value
    });
    
    const result = buildHierarchyWithProjects(tasks.value, projects.value);
    console.log('📋 hierarchyTasks result:', result);
    return result;
  });

  return {
    buildHierarchyWithProjects,
    flattenHierarchy,
    calculateTotalHours,
    calculateTotalAmount,
    hasWorklogsInTree,
    formatHours,
    formatCurrency,
    hierarchyTasks,
  };
}
