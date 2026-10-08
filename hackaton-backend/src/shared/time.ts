const timezone = 'America/Guayaquil';
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const offsetHours = 5;
const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

function dateParts(date: Date): { year: number; month: number; day: number } {
  const parts = formatter.formatToParts(date);
  const read = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

function dayStartUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) + offsetHours * hourMs);
}

/** Representa la fecha civil de Guayaquil como fecha UTC para una columna DATE. */
export function guayaquilDate(date: Date): Date {
  const { year, month, day } = dateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Devuelve el último milisegundo del día local. */
export function endOfDayGuayaquil(date: Date): Date {
  const { year, month, day } = dateParts(date);
  return new Date(dayStartUtc(year, month, day).getTime() + dayMs - 1);
}

/** Vence al final de la misma fecha civil un año después. */
export function addOneYearEndOfDay(date: Date): Date {
  const { year, month, day } = dateParts(date);
  const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
  return new Date(
    dayStartUtc(year + 1, month, Math.min(day, lastDay)).getTime() + dayMs - 1,
  );
}

/** Devuelve el inicio del mes en Guayaquil como instante UTC. */
export function startOfMonthGuayaquil(date: Date): Date {
  const { year, month } = dateParts(date);
  return dayStartUtc(year, month, 1);
}

/** Devuelve el último milisegundo del mes en Guayaquil. */
export function endOfMonthGuayaquil(date: Date): Date {
  const { year, month } = dateParts(date);
  return new Date(dayStartUtc(year, month + 1, 1).getTime() - 1);
}
