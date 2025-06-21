
import { MONTH_NAMES, DAY_NAMES_SHORT } from '../constants';

export const formatISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseISODate = (dateString: string): Date => {
  return new Date(dateString);
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  // Handle cases where the day of the month might change (e.g., Jan 31 + 1 month = Feb 28/29)
  if (result.getDate() < date.getDate() && date.getMonth() !== (result.getMonth() - months + 12) % 12) {
      result.setDate(0); // Go to the last day of the previous month
  }
  return result;
};


export const getMonthName = (monthIndex: number): string => {
  return MONTH_NAMES[monthIndex];
};

export const getDayShortName = (dayIndex: number): string => {
  return DAY_NAMES_SHORT[dayIndex];
};

export const generateMockId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const getDaysInYear = (year: number): number => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
};

export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const displayDateRange = (startDateStr: string, endDateStr: string): string => {
  const startDate = parseISODate(startDateStr);
  const endDate = parseISODate(endDateStr);
  
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

  if (isSameDay(startDate, endDate)) {
    return startDate.toLocaleDateString(undefined, options);
  }
  return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
};

export const todayISO = (): string => formatISODate(new Date());

// Format date for input[type="date"]
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
