import { format } from "date-fns";
import { hu } from "date-fns/locale";

export function formatDisplayDate(date: Date) {
  return format(date, "yyyy. LLLL d. EEEE", { locale: hu });
}
