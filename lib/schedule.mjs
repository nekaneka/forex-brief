// This is the source for the runner, public schedule metadata and workflow cron.
// Times are scheduled starts; publication also depends on research and deployment.
export const REPORT_SCHEDULE = Object.freeze({
  timezone: "Europe/Vienna",
  weekdaysOnly: true,
  windowMinutes: 30,
  retryMinutes: Object.freeze([0, 10, 20]),
  sessions: Object.freeze([
    Object.freeze({ id: "morning", time: "06:30" }),
    Object.freeze({ id: "afternoon", time: "13:30" }),
  ]),
});

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function viennaParts(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: REPORT_SCHEDULE.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return {
    ...p,
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}
export function dueSession(now = new Date(), completed = []) {
  const local = viennaParts(now);
  if (REPORT_SCHEDULE.weekdaysOnly && ["Sat", "Sun"].includes(local.weekday)) {
    return null;
  }

  const session = REPORT_SCHEDULE.sessions.find(({ time }) => {
    const start = minutesFromTime(time);
    return (
      local.minutes >= start &&
      local.minutes < start + REPORT_SCHEDULE.windowMinutes
    );
  });
  if (!session) return null;

  const id = `${local.date}-${session.id}`;
  return completed.includes(id) ? null : { session: session.id, id };
}

// GitHub cron uses UTC. Trigger at both Austrian offsets and let dueSession
// reject the inactive offset, weekends, late jobs and already completed sessions.
export function researchCronExpressions() {
  const weekdays = REPORT_SCHEDULE.weekdaysOnly ? "1-5" : "*";
  return REPORT_SCHEDULE.sessions.flatMap(({ time }) => {
    const minuteGroups = new Map();
    for (const offset of [1, 2]) {
      for (const retry of REPORT_SCHEDULE.retryMinutes) {
        const utcMinutes =
          (minutesFromTime(time) + retry - offset * 60 + 1440) % 1440;
        const hour = Math.floor(utcMinutes / 60);
        if (!minuteGroups.has(hour)) minuteGroups.set(hour, new Set());
        minuteGroups.get(hour).add(utcMinutes % 60);
      }
    }
    const hourGroups = new Map();
    for (const [hour, minutes] of minuteGroups) {
      const key = [...minutes].sort((a, b) => a - b).join(",");
      if (!hourGroups.has(key)) hourGroups.set(key, []);
      hourGroups.get(key).push(hour);
    }
    return [...hourGroups].map(
      ([minutes, hours]) =>
        `${minutes} ${hours.sort((a, b) => a - b).join(",")} * * ${weekdays}`,
    );
  });
}

export function researchCronBlock() {
  return researchCronExpressions()
    .map((cron) => `    - cron: '${cron}'`)
    .join("\n");
}
