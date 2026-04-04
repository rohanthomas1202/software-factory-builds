import { z } from 'zod';

export const timezoneSchema = z.object({
  value: z.string(),
  label: z.string(),
  offset: z.string(),
  abbr: z.string(),
  utc: z.array(z.string()),
});

export type Timezone = z.infer<typeof timezoneSchema>;

export const timezones: Timezone[] = [
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Standard Time', offset: '-10:00', abbr: 'HAST', utc: ['-10:00'] },
  { value: 'America/Anchorage', label: 'Alaska Standard Time', offset: '-09:00', abbr: 'AKST', utc: ['-09:00'] },
  { value: 'America/Los_Angeles', label: 'Pacific Standard Time', offset: '-08:00', abbr: 'PST', utc: ['-08:00'] },
  { value: 'America/Denver', label: 'Mountain Standard Time', offset: '-07:00', abbr: 'MST', utc: ['-07:00'] },
  { value: 'America/Chicago', label: 'Central Standard Time', offset: '-06:00', abbr: 'CST', utc: ['-06:00'] },
  { value: 'America/New_York', label: 'Eastern Standard Time', offset: '-05:00', abbr: 'EST', utc: ['-05:00'] },
  { value: 'America/Halifax', label: 'Atlantic Standard Time', offset: '-04:00', abbr: 'AST', utc: ['-04:00'] },
  { value: 'America/St_Johns', label: 'Newfoundland Standard Time', offset: '-03:30', abbr: 'NST', utc: ['-03:30'] },
  { value: 'America/Sao_Paulo', label: 'Brasilia Standard Time', offset: '-03:00', abbr: 'BRT', utc: ['-03:00'] },
  { value: 'Atlantic/Cape_Verde', label: 'Cape Verde Standard Time', offset: '-01:00', abbr: 'CVT', utc: ['-01:00'] },
  { value: 'Europe/London', label: 'Greenwich Mean Time', offset: '+00:00', abbr: 'GMT', utc: ['+00:00'] },
  { value: 'Europe/Berlin', label: 'Central European Time', offset: '+01:00', abbr: 'CET', utc: ['+01:00'] },
  { value: 'Europe/Athens', label: 'Eastern European Time', offset: '+02:00', abbr: 'EET', utc: ['+02:00'] },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time', offset: '+03:00', abbr: 'MSK', utc: ['+03:00'] },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time', offset: '+04:00', abbr: 'GST', utc: ['+04:00'] },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time', offset: '+05:00', abbr: 'PKT', utc: ['+05:00'] },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time', offset: '+06:00', abbr: 'BST', utc: ['+06:00'] },
  { value: 'Asia/Bangkok', label: 'Indochina Time', offset: '+07:00', abbr: 'ICT', utc: ['+07:00'] },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time', offset: '+08:00', abbr: 'SGT', utc: ['+08:00'] },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time', offset: '+09:00', abbr: 'JST', utc: ['+09:00'] },
  { value: 'Australia/Sydney', label: 'Australian Eastern Standard Time', offset: '+10:00', abbr: 'AEST', utc: ['+10:00'] },
  { value: 'Pacific/Noumea', label: 'New Caledonia Time', offset: '+11:00', abbr: 'NCT', utc: ['+11:00'] },
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time', offset: '+12:00', abbr: 'NZST', utc: ['+12:00'] },
  { value: 'Pacific/Apia', label: 'Apia Standard Time', offset: '+13:00', abbr: 'WSST', utc: ['+13:00'] },
  { value: 'Pacific/Kiritimati', label: 'Line Islands Time', offset: '+14:00', abbr: 'LINT', utc: ['+14:00'] },
];

export function getTimezoneByValue(value: string): Timezone | undefined {
  return timezones.find(tz => tz.value === value);
}

export function getCurrentTimezone(): Timezone {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const foundTimezone = timezones.find(tz => tz.utc.includes(userTimezone) || tz.value === userTimezone);
  
  if (foundTimezone) {
    return foundTimezone;
  }

  // Fallback to UTC if timezone not found
  return {
    value: 'UTC',
    label: 'Coordinated Universal Time',
    offset: '+00:00',
    abbr: 'UTC',
    utc: ['UTC']
  };
}

export function formatTimezoneOffset(offset: string): string {
  const sign = offset.charAt(0);
  const hours = offset.substring(1, 3);
  const minutes = offset.substring(4, 6);
  
  if (sign === '+') {
    return `UTC+${hours}:${minutes}`;
  } else if (sign === '-') {
    return `UTC-${hours}:${minutes}`;
  }
  return `UTC${offset}`;
}

export function getTimezoneOptions() {
  return timezones.map(tz => ({
    value: tz.value,
    label: `${tz.label} (${formatTimezoneOffset(tz.offset)})`,
  }));
}

export function isValidTimezone(timezone: string): boolean {
  return timezones.some(tz => tz.value === timezone);
}

export function getTimezoneForSelect() {
  return timezones.map(tz => ({
    value: tz.value,
    label: `${tz.label} (${tz.abbr})`,
    description: formatTimezoneOffset(tz.offset),
  }));
}