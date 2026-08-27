import { format, formatISO } from "date-fns";
import { hu } from "date-fns/locale";

export function formatDisplayDate(date: Date) {
  return format(date, "yyyy. LLLL d. EEEE", { locale: hu });
}

export function formatDisplayDateWithoutDay(date: Date) {
  return format(date, "yyyy. LLLL d.", { locale: hu });
}

export function toApiDate(date: Date): string {
  return formatISO(date, { representation: "date" });
}
