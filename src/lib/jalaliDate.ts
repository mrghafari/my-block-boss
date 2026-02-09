import { format, parse } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

export const formatJalaliDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "yyyy/MM/dd", { locale: faIR });
};

export const formatJalaliDateFull = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "d MMMM yyyy", { locale: faIR });
};

export const toJalaliString = (date: Date) => {
  return format(date, "yyyy/MM/dd", { locale: faIR });
};

export const getTodayJalali = () => {
  return format(new Date(), "yyyy/MM/dd", { locale: faIR });
};

export const fromJalaliString = (jalaliDate: string): string => {
  // Parse the Jalali date string and convert to ISO date string
  const parsed = parse(jalaliDate, "yyyy/MM/dd", new Date(), { locale: faIR });
  return parsed.toISOString().split("T")[0];
};
