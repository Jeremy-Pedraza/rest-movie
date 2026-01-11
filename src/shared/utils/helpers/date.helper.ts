// src/shared/utils/helpers/date.helper.ts

/**
 * @fileoverview Utilidades para manipulación de fechas
 * @module shared/utils/helpers/date
 * @description Usa dayjs internamente para operaciones complejas
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import isTodayPlugin from 'dayjs/plugin/isToday';
import isYesterdayPlugin from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/es';

// Configurar plugins de dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isBetweenPlugin);
dayjs.extend(isTodayPlugin);
dayjs.extend(isYesterdayPlugin);
dayjs.extend(weekOfYear);
dayjs.extend(quarterOfYear);
dayjs.extend(duration);
dayjs.locale('es');

// Timezone por defecto (Colombia)
const DEFAULT_TIMEZONE = 'America/Bogota';

// ============================================
// FORMATOS PREDEFINIDOS
// ============================================

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  TIME_SHORT: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATETIME_SHORT: 'YYYY-MM-DD HH:mm',
  DATE_DISPLAY: 'DD/MM/YYYY',
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm',
  DATE_LONG: 'DD [de] MMMM [de] YYYY',
  DATETIME_LONG: 'DD [de] MMMM [de] YYYY [a las] HH:mm',
  MONTH_YEAR: 'MMMM YYYY',
  DAY_MONTH: 'DD [de] MMMM',
  YEAR: 'YYYY',
  MONTH: 'MMMM',
  DAY: 'DD',
} as const;

// ============================================
// FUNCIONES DE PARSING Y FORMATO
// ============================================

/**
 * Parsea una fecha a objeto dayjs
 * @param date - Fecha a parsear
 * @param tz - Timezone (default: America/Bogota)
 * @returns Objeto dayjs
 */
export function parseDate(
  date: Date | string | number,
  tz: string = DEFAULT_TIMEZONE,
): dayjs.Dayjs {
  return dayjs(date).tz(tz);
}

/**
 * Formatea una fecha según el formato especificado
 * @param date - Fecha a formatear
 * @param format - Formato de salida (default: DATE_DISPLAY)
 * @param tz - Timezone (default: America/Bogota)
 * @returns Fecha formateada
 * @example
 * formatDate(new Date(), 'DD/MM/YYYY') // '15/01/2025'
 */
export function formatDate(
  date: Date | string | number,
  format: string = DATE_FORMATS.DATE_DISPLAY,
  tz: string = DEFAULT_TIMEZONE,
): string {
  if (!date) return '';
  return parseDate(date, tz).format(format);
}

/**
 * Formatea una fecha para mostrar (DD/MM/YYYY)
 * @param date - Fecha a formatear
 * @returns Fecha formateada para display
 */
export function formatDateDisplay(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATE_DISPLAY);
}

/**
 * Formatea una fecha con hora (DD/MM/YYYY HH:mm)
 * @param date - Fecha a formatear
 * @returns Fecha con hora formateada
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATETIME_DISPLAY);
}

/**
 * Formatea una fecha larga (15 de Enero de 2025)
 * @param date - Fecha a formatear
 * @returns Fecha en formato largo
 */
export function formatDateLong(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATE_LONG);
}

/**
 * Formatea solo la hora (HH:mm)
 * @param date - Fecha de la que extraer la hora
 * @returns Hora formateada
 */
export function formatTime(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.TIME_SHORT);
}

/**
 * Convierte fecha a formato ISO
 * @param date - Fecha a convertir
 * @returns Fecha en formato ISO
 */
export function toISOString(date: Date | string | number): string {
  return parseDate(date).toISOString();
}

/**
 * Convierte fecha a formato de base de datos (YYYY-MM-DD HH:mm:ss)
 * @param date - Fecha a convertir
 * @returns Fecha para DB
 */
export function toDBFormat(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATETIME);
}

// ============================================
// FUNCIONES DE OBTENCIÓN
// ============================================

/**
 * Obtiene la fecha actual
 * @param tz - Timezone
 * @returns Fecha actual como dayjs
 */
export function now(tz: string = DEFAULT_TIMEZONE): dayjs.Dayjs {
  return dayjs().tz(tz);
}

/**
 * Obtiene la fecha actual como Date
 * @returns Fecha actual
 */
export function today(): Date {
  return now().toDate();
}

/**
 * Obtiene el inicio del día de una fecha
 * @param date - Fecha base
 * @returns Inicio del día (00:00:00)
 */
export function startOfDay(date: Date | string | number = new Date()): Date {
  return parseDate(date).startOf('day').toDate();
}

/**
 * Obtiene el fin del día de una fecha
 * @param date - Fecha base
 * @returns Fin del día (23:59:59.999)
 */
export function endOfDay(date: Date | string | number = new Date()): Date {
  return parseDate(date).endOf('day').toDate();
}

/**
 * Obtiene el inicio de la semana
 * @param date - Fecha base
 * @returns Inicio de la semana
 */
export function startOfWeek(date: Date | string | number = new Date()): Date {
  return parseDate(date).startOf('week').toDate();
}

/**
 * Obtiene el fin de la semana
 * @param date - Fecha base
 * @returns Fin de la semana
 */
export function endOfWeek(date: Date | string | number = new Date()): Date {
  return parseDate(date).endOf('week').toDate();
}

/**
 * Obtiene el inicio del mes
 * @param date - Fecha base
 * @returns Inicio del mes
 */
export function startOfMonth(date: Date | string | number = new Date()): Date {
  return parseDate(date).startOf('month').toDate();
}

/**
 * Obtiene el fin del mes
 * @param date - Fecha base
 * @returns Fin del mes
 */
export function endOfMonth(date: Date | string | number = new Date()): Date {
  return parseDate(date).endOf('month').toDate();
}

/**
 * Obtiene el inicio del año
 * @param date - Fecha base
 * @returns Inicio del año
 */
export function startOfYear(date: Date | string | number = new Date()): Date {
  return parseDate(date).startOf('year').toDate();
}

/**
 * Obtiene el fin del año
 * @param date - Fecha base
 * @returns Fin del año
 */
export function endOfYear(date: Date | string | number = new Date()): Date {
  return parseDate(date).endOf('year').toDate();
}

// ============================================
// FUNCIONES DE MANIPULACIÓN
// ============================================

/**
 * Agrega tiempo a una fecha
 * @param date - Fecha base
 * @param amount - Cantidad a agregar
 * @param unit - Unidad de tiempo
 * @returns Nueva fecha
 * @example
 * addTime(new Date(), 5, 'days') // 5 días después
 */
export function addTime(
  date: Date | string | number,
  amount: number,
  unit: dayjs.ManipulateType,
): Date {
  return parseDate(date).add(amount, unit).toDate();
}

/**
 * Resta tiempo a una fecha
 * @param date - Fecha base
 * @param amount - Cantidad a restar
 * @param unit - Unidad de tiempo
 * @returns Nueva fecha
 */
export function subtractTime(
  date: Date | string | number,
  amount: number,
  unit: dayjs.ManipulateType,
): Date {
  return parseDate(date).subtract(amount, unit).toDate();
}

/**
 * Agrega días a una fecha
 * @param date - Fecha base
 * @param days - Días a agregar
 * @returns Nueva fecha
 */
export function addDays(date: Date | string | number, days: number): Date {
  return addTime(date, days, 'day');
}

/**
 * Agrega meses a una fecha
 * @param date - Fecha base
 * @param months - Meses a agregar
 * @returns Nueva fecha
 */
export function addMonths(date: Date | string | number, months: number): Date {
  return addTime(date, months, 'month');
}

/**
 * Agrega años a una fecha
 * @param date - Fecha base
 * @param years - Años a agregar
 * @returns Nueva fecha
 */
export function addYears(date: Date | string | number, years: number): Date {
  return addTime(date, years, 'year');
}

/**
 * Agrega horas a una fecha
 * @param date - Fecha base
 * @param hours - Horas a agregar
 * @returns Nueva fecha
 */
export function addHours(date: Date | string | number, hours: number): Date {
  return addTime(date, hours, 'hour');
}

/**
 * Agrega minutos a una fecha
 * @param date - Fecha base
 * @param minutes - Minutos a agregar
 * @returns Nueva fecha
 */
export function addMinutes(date: Date | string | number, minutes: number): Date {
  return addTime(date, minutes, 'minute');
}

// ============================================
// FUNCIONES DE COMPARACIÓN
// ============================================

/**
 * Verifica si es hoy
 * @param date - Fecha a verificar
 * @returns true si es hoy
 */
export function isToday(date: Date | string | number): boolean {
  return parseDate(date).isToday();
}

/**
 * Verifica si es ayer
 * @param date - Fecha a verificar
 * @returns true si es ayer
 */
export function isYesterday(date: Date | string | number): boolean {
  return parseDate(date).isYesterday();
}

/**
 * Verifica si una fecha es anterior a otra
 * @param date - Fecha a verificar
 * @param compareDate - Fecha de comparación
 * @returns true si date es anterior
 */
export function isBefore(
  date: Date | string | number,
  compareDate: Date | string | number,
): boolean {
  return parseDate(date).isBefore(parseDate(compareDate));
}

/**
 * Verifica si una fecha es posterior a otra
 * @param date - Fecha a verificar
 * @param compareDate - Fecha de comparación
 * @returns true si date es posterior
 */
export function isAfter(
  date: Date | string | number,
  compareDate: Date | string | number,
): boolean {
  return parseDate(date).isAfter(parseDate(compareDate));
}

/**
 * Verifica si una fecha está entre dos fechas
 * @param date - Fecha a verificar
 * @param startDate - Fecha inicio
 * @param endDate - Fecha fin
 * @param inclusivity - Tipo de inclusión (default: '[]')
 * @returns true si está en el rango
 */
export function isBetween(
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number,
  inclusivity: '()' | '[]' | '[)' | '(]' = '[]',
): boolean {
  return parseDate(date).isBetween(parseDate(startDate), parseDate(endDate), null, inclusivity);
}

/**
 * Verifica si dos fechas son el mismo día
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si son el mismo día
 */
export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  return parseDate(date1).isSame(parseDate(date2), 'day');
}

/**
 * Verifica si una fecha está en el pasado
 * @param date - Fecha a verificar
 * @returns true si está en el pasado
 */
export function isPast(date: Date | string | number): boolean {
  return isBefore(date, new Date());
}

/**
 * Verifica si una fecha está en el futuro
 * @param date - Fecha a verificar
 * @returns true si está en el futuro
 */
export function isFuture(date: Date | string | number): boolean {
  return isAfter(date, new Date());
}

/**
 * Verifica si es fin de semana
 * @param date - Fecha a verificar
 * @returns true si es sábado o domingo
 */
export function isWeekend(date: Date | string | number): boolean {
  const day = parseDate(date).day();
  return day === 0 || day === 6;
}

/**
 * Verifica si es día hábil (lunes a viernes)
 * @param date - Fecha a verificar
 * @returns true si es día hábil
 */
export function isWeekday(date: Date | string | number): boolean {
  return !isWeekend(date);
}

// ============================================
// FUNCIONES DE DIFERENCIA
// ============================================

/**
 * Calcula la diferencia entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @param unit - Unidad de medida
 * @returns Diferencia en la unidad especificada
 */
export function diff(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: dayjs.QUnitType | dayjs.OpUnitType = 'day',
): number {
  return parseDate(date1).diff(parseDate(date2), unit);
}

/**
 * Calcula los días entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Días de diferencia
 */
export function daysBetween(date1: Date | string | number, date2: Date | string | number): number {
  return Math.abs(diff(date1, date2, 'day'));
}

/**
 * Calcula los meses entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Meses de diferencia
 */
export function monthsBetween(
  date1: Date | string | number,
  date2: Date | string | number,
): number {
  return Math.abs(diff(date1, date2, 'month'));
}

/**
 * Calcula los años entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Años de diferencia
 */
export function yearsBetween(date1: Date | string | number, date2: Date | string | number): number {
  return Math.abs(diff(date1, date2, 'year'));
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param birthDate - Fecha de nacimiento
 * @returns Edad en años
 */
export function calculateAge(birthDate: Date | string | number): number {
  return yearsBetween(birthDate, new Date());
}

// ============================================
// FUNCIONES DE TIEMPO RELATIVO
// ============================================

/**
 * Obtiene el tiempo relativo desde ahora
 * @param date - Fecha a comparar
 * @returns Texto relativo (ej: "hace 2 horas")
 * @example
 * timeAgo(subractDays(new Date(), 2)) // 'hace 2 días'
 */
export function timeAgo(date: Date | string | number): string {
  return parseDate(date).fromNow();
}

/**
 * Obtiene el tiempo relativo hasta una fecha
 * @param date - Fecha futura
 * @returns Texto relativo (ej: "en 2 días")
 */
export function timeUntil(date: Date | string | number): string {
  return parseDate(date).toNow();
}

/**
 * Obtiene el tiempo relativo entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Texto relativo
 */
export function timeBetween(date1: Date | string | number, date2: Date | string | number): string {
  return parseDate(date1).from(parseDate(date2));
}

// ============================================
// FUNCIONES DE RANGO
// ============================================

/**
 * Genera un rango de fechas
 * @param startDate - Fecha inicio
 * @param endDate - Fecha fin
 * @param step - Paso en días (default: 1)
 * @returns Array de fechas
 */
export function dateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  step: number = 1,
): Date[] {
  const dates: Date[] = [];
  let current = parseDate(startDate);
  const end = parseDate(endDate);

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.toDate());
    current = current.add(step, 'day');
  }

  return dates;
}

/**
 * Obtiene los días hábiles en un rango
 * @param startDate - Fecha inicio
 * @param endDate - Fecha fin
 * @returns Número de días hábiles
 */
export function workdaysInRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
): number {
  const dates = dateRange(startDate, endDate);
  return dates.filter((d) => isWeekday(d)).length;
}

// ============================================
// FUNCIONES DE OBTENCIÓN DE PARTES
// ============================================

/**
 * Obtiene el año de una fecha
 * @param date - Fecha
 * @returns Año
 */
export function getYear(date: Date | string | number): number {
  return parseDate(date).year();
}

/**
 * Obtiene el mes de una fecha (1-12)
 * @param date - Fecha
 * @returns Mes
 */
export function getMonth(date: Date | string | number): number {
  return parseDate(date).month() + 1;
}

/**
 * Obtiene el día del mes
 * @param date - Fecha
 * @returns Día
 */
export function getDay(date: Date | string | number): number {
  return parseDate(date).date();
}

/**
 * Obtiene el día de la semana (0-6, domingo = 0)
 * @param date - Fecha
 * @returns Día de la semana
 */
export function getDayOfWeek(date: Date | string | number): number {
  return parseDate(date).day();
}

/**
 * Obtiene el nombre del día de la semana
 * @param date - Fecha
 * @returns Nombre del día
 */
export function getDayName(date: Date | string | number): string {
  return parseDate(date).format('dddd');
}

/**
 * Obtiene el nombre del mes
 * @param date - Fecha
 * @returns Nombre del mes
 */
export function getMonthName(date: Date | string | number): string {
  return parseDate(date).format('MMMM');
}

/**
 * Obtiene la semana del año
 * @param date - Fecha
 * @returns Número de semana
 */
export function getWeekOfYear(date: Date | string | number): number {
  return parseDate(date).week();
}

/**
 * Obtiene el trimestre del año (1-4)
 * @param date - Fecha
 * @returns Trimestre
 */
export function getQuarter(date: Date | string | number): number {
  return parseDate(date).quarter();
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Verifica si una fecha es válida
 * @param date - Fecha a verificar
 * @returns true si es válida
 */
export function isValidDate(date: any): boolean {
  return dayjs(date).isValid();
}

/**
 * Obtiene los días en un mes
 * @param date - Fecha del mes
 * @returns Número de días en el mes
 */
export function daysInMonth(date: Date | string | number): number {
  return parseDate(date).daysInMonth();
}

/**
 * Verifica si es año bisiesto
 * @param year - Año a verificar
 * @returns true si es bisiesto
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Obtiene el timestamp Unix (segundos)
 * @param date - Fecha
 * @returns Timestamp en segundos
 */
export function toUnixTimestamp(date: Date | string | number): number {
  return parseDate(date).unix();
}

/**
 * Crea una fecha desde timestamp Unix
 * @param timestamp - Timestamp en segundos
 * @returns Fecha
 */
export function fromUnixTimestamp(timestamp: number): Date {
  return dayjs.unix(timestamp).toDate();
}

/**
 * Formatea una duración en formato legible
 * @param milliseconds - Duración en milisegundos
 * @returns Duración formateada
 * @example
 * formatDuration(3661000) // '1h 1m 1s'
 */
export function formatDuration(milliseconds: number): string {
  const dur = dayjs.duration(milliseconds);
  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();
  const seconds = dur.seconds();

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Obtiene la próxima ocurrencia de un día de la semana
 * @param dayOfWeek - Día de la semana (0-6)
 * @param fromDate - Fecha base
 * @returns Próxima fecha de ese día
 */
export function getNextDayOfWeek(
  dayOfWeek: number,
  fromDate: Date | string | number = new Date(),
): Date {
  const date = parseDate(fromDate);
  const currentDay = date.day();
  const daysUntil = (dayOfWeek + 7 - currentDay) % 7 || 7;
  return date.add(daysUntil, 'day').toDate();
}

/**
 * Combina una fecha con una hora
 * @param date - Fecha
 * @param time - Hora en formato HH:mm o HH:mm:ss
 * @returns Fecha combinada
 */
export function combineDateAndTime(date: Date | string | number, time: string): Date {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number);
  return parseDate(date).hour(hours).minute(minutes).second(seconds).toDate();
}
