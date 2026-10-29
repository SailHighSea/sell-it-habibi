export const MEETUP_HOURS = [10, 13, 17, 20] as const;

export type MeetupDay = { iso: string; offset: number };

/** The next `count` calendar days starting today, as local midnight timestamps. */
export function meetupDays(now: Date = new Date(), count = 6): MeetupDay[] {
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return { iso: d.toISOString(), offset };
  });
}

/** Today's slots that have already passed are not offered. */
export function availableHours(day: MeetupDay, now: Date = new Date()): number[] {
  if (day.offset !== 0) return [...MEETUP_HOURS];
  return MEETUP_HOURS.filter((h) => h * 60 > now.getHours() * 60 + now.getMinutes() + 30);
}

export function buildMeetupAt(day: MeetupDay, hour: number): string {
  const d = new Date(day.iso);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
