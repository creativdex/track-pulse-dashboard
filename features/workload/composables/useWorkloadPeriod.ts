import { ref, computed, watch } from 'vue';
import { CalendarDate, parseDate } from '@internationalized/date';
import { useWorkloadTableStore } from '../stores/useWorkloadTableStore';

export interface SimpleCalendarDate {
  year: number;
  month: number;
  day: number;
}

export enum EPreSetedDataRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}

function toSimpleCalendarDate(date: unknown): SimpleCalendarDate | undefined {
  if (
    date &&
    typeof date === 'object' &&
    'year' in date &&
    'month' in date &&
    'day' in date
  ) {
    const d = date as { year: number; month: number; day: number };
    return { year: d.year, month: d.month, day: d.day };
  }
  return undefined;
}

function parseCalendarDate(str: string | undefined): CalendarDate | undefined {
  if (!str) return undefined;
  try {
    return parseDate(str);
  } catch {
    return undefined;
  }
}

export function useWorkloadPeriod() {
  const tableStore = useWorkloadTableStore();
  tableStore.loadPeriodFromStorage();

  const startDate = ref<CalendarDate | undefined>();
  const endDate = ref<CalendarDate | undefined>();

  if (tableStore.period.start && tableStore.period.end) {
    const start = parseCalendarDate(tableStore.period.start);
    const end = parseCalendarDate(tableStore.period.end);
    if (start && end) {
      startDate.value = start;
      endDate.value = end;
    }
  }

  const calendarRange = computed({
    get: () => ({ start: startDate.value, end: endDate.value }),
    set: (val: { start: CalendarDate | undefined; end: CalendarDate | undefined }) => {
      startDate.value = val.start;
      endDate.value = val.end;
    },
  });

  watch([startDate, endDate], ([start, end]) => {
    // Сохраняем период даже если только одна дата выбрана
    tableStore.period.start = start?.toString() || '';
    tableStore.period.end = end?.toString() || '';
    tableStore.savePeriodToStorage();
  });

  const startSimple = computed(() => toSimpleCalendarDate(startDate.value));
  const endSimple = computed(() => toSimpleCalendarDate(endDate.value));

  const formatDateValue = (date: SimpleCalendarDate): string => {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  };

  const formatDateForDisplay = (date: SimpleCalendarDate): string => {
    return `${date.day}.${date.month}.${date.year}`;
  };

  const preSetedDataRange = (period: EPreSetedDataRange) => {
    const today = new Date();
    let start: CalendarDate;
    let end: CalendarDate;
    switch (period) {
      case EPreSetedDataRange.TODAY: {
        start = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        end = start;
        break;
      }
      case EPreSetedDataRange.WEEK: {
        const startDateObj = new Date(today);
        startDateObj.setDate(today.getDate() - 6);
        start = new CalendarDate(startDateObj.getFullYear(), startDateObj.getMonth() + 1, startDateObj.getDate());
        end = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        break;
      }
      case EPreSetedDataRange.MONTH: {
        const startDateObj = new Date(today);
        startDateObj.setMonth(today.getMonth() - 1);
        start = new CalendarDate(startDateObj.getFullYear(), startDateObj.getMonth() + 1, startDateObj.getDate());
        end = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        break;
      }
      default:
        return;
    }
    startDate.value = start;
    endDate.value = end;
    tableStore.period.start = start.toString();
    tableStore.period.end = end.toString();
    tableStore.savePeriodToStorage();
  };

  // Универсальный обработчик для календаря
  function handleCalendarUpdate(val: { start?: import('@internationalized/date').DateValue; end?: import('@internationalized/date').DateValue } | null) {
    if (!val) {
      startDate.value = undefined;
      endDate.value = undefined;
      return;
    }
    
    // Более простая проверка - проверяем наличие нужных свойств
    const isValidDate = (d: unknown): d is CalendarDate => {
      return !!d && typeof d === 'object' && 'year' in d && 'month' in d && 'day' in d;
    };
    
    // Обновляем startDate и endDate напрямую, чтобы сработал watcher
    const newStart = isValidDate(val.start) ? val.start as CalendarDate : undefined;
    const newEnd = isValidDate(val.end) ? val.end as CalendarDate : undefined;
    
    startDate.value = newStart;
    endDate.value = newEnd;
  }

  return {
    startDate,
    endDate,
    calendarRange,
    startSimple,
    endSimple,
    formatDateValue,
    formatDateForDisplay,
    preSetedDataRange,
    EPreSetedDataRange,
    handleCalendarUpdate,
  };
}
