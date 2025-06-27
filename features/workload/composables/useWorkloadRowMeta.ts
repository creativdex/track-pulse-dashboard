import type { TableRowItem } from './useWorkloadTable';

export enum WorkloadSpecialType {
  None = 'none',
  Epic = 'epic',
  Project = 'project',
  Bug = 'bug',
  Task = 'task',
  NewFeature = 'newFeature',
  Improvement = 'improvement',
  Refactoring = 'refactoring',
  Story = 'story',
  ChangeRequest = 'changeRequest',
  Incident = 'incident',
  ServiceRequest = 'serviceRequest',
  Release = 'release',
  Leave = 'leave',
  BusinessTrip = 'businessTrip',
  Changes = 'changes',
  Documents = 'documents',
  Request = 'request',
  Vacancy = 'vacancy',
  Applicant = 'applicant',
  Goal = 'goal',
  Milestone = 'milestone',
  Research = 'reserc',
  Review = 'revu',
  Communication = 'kommunikacia',
}

const typeDisplayMap: Record<string, string> = {
  bug: 'Ошибка',
  task: 'Задача',
  newFeature: 'Новая возможность',
  improvement: 'Улучшение',
  refactoring: 'Рефакторинг',
  epic: 'Епик',
  story: 'Сторя',
  changeRequest: 'Запрос на изменения',
  incident: 'Инцидент',
  serviceRequest: 'Запрос на обслуживание',
  release: 'Релиз',
  project: 'Проект',
  leave: 'Отсутствие',
  businessTrip: 'Командировка',
  changes: 'Изменения',
  documents: 'Документы',
  request: 'Запрос',
  vacancy: 'Вакансия',
  applicant: 'Кандидат',
  goal: 'Цель',
  milestone: 'Веха',
  reserc: 'Ресерч',
  revu: 'Ревью',
  kommunikacia: 'Коммуникация',
};

export type WorkloadRowMeta = {
  specialType: WorkloadSpecialType;
  badgeClass: string;
  summaryClass: string;
  hideKey: boolean;
  keyClass: string;
  amountClass: string;
  hoursSpentClass: string;
  statusClass: string;
  assigneeClass: string;
  deadlineClass: string;
  resolvedAtClass: string;
  deltaTimeClass: string;
  actionsClass: string;
  descriptionClass: string;
  displayType: string;
};

export function useWorkloadRowMeta(item: TableRowItem): WorkloadRowMeta {
  const displayType = typeDisplayMap[item.typeKey?.toLowerCase?.() ? item.typeKey.toLowerCase() : item.typeKey] || '';
  // Project
  if ('isProject' in item && item.isProject) {
    return {
      specialType: WorkloadSpecialType.Project,
      badgeClass: '',
      summaryClass: 'font-bold text-xl text-blue-700 dark:text-blue-200 truncate',
      hideKey: true,
      keyClass: 'font-mono text-xs text-blue-700 dark:text-blue-200 flex-shrink-0',
      amountClass: 'font-bold text-blue-700 dark:text-blue-200',
      hoursSpentClass: 'font-bold text-blue-700 dark:text-blue-200',
      statusClass: 'text-blue-700 dark:text-blue-200',
      assigneeClass: 'text-blue-700 dark:text-blue-200 font-semibold',
      deadlineClass: 'text-blue-700 dark:text-blue-200 font-semibold',
      resolvedAtClass: 'text-blue-700 dark:text-blue-200 font-semibold',
      deltaTimeClass: 'text-blue-700 dark:text-blue-200 font-semibold',
      actionsClass: '',
      descriptionClass: 'text-blue-700 dark:text-blue-200',
      displayType: displayType || 'Проект',
    };
  }
  // Epic
  if (item.typeKey === 'epic' || item.typeKey === 'Epic') {
    return {
      specialType: WorkloadSpecialType.Epic,
      badgeClass: 'badge-epic',
      summaryClass: 'font-bold text-lg text-violet-700 dark:text-violet-200 truncate',
      hideKey: false,
      keyClass: 'font-mono text-xs text-violet-700 dark:text-violet-200 flex-shrink-0',
      amountClass: 'font-bold text-violet-700 dark:text-violet-200',
      hoursSpentClass: 'font-bold text-violet-700 dark:text-violet-200',
      statusClass: 'text-violet-700 dark:text-violet-200',
      assigneeClass: 'text-violet-700 dark:text-violet-200 font-semibold',
      deadlineClass: 'text-violet-700 dark:text-violet-200 font-semibold',
      resolvedAtClass: 'text-violet-700 dark:text-violet-200 font-semibold',
      deltaTimeClass: 'text-violet-700 dark:text-violet-200 font-semibold',
      actionsClass: '',
      descriptionClass: 'text-violet-700 dark:text-violet-200',
      displayType: displayType || 'Эпик',
    };
  }
  // Default
  return {
    specialType: WorkloadSpecialType.None,
    badgeClass: '',
    summaryClass: 'font-medium text-gray-900 dark:text-white truncate',
    hideKey: false,
    keyClass: 'font-mono text-xs text-gray-500 flex-shrink-0',
    amountClass: '',
    hoursSpentClass: '',
    statusClass: '',
    assigneeClass: '',
    deadlineClass: '',
    resolvedAtClass: '',
    deltaTimeClass: '',
    actionsClass: '',
    descriptionClass: 'text-sm text-gray-500 truncate',
    displayType,
  };
}
