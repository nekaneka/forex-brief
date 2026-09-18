export function viennaParts(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
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
  const p = viennaParts(now),
    weekend = ['Sat', 'Sun'].includes(p.weekday);
  const session =
    p.minutes >= 8 * 60 && p.minutes < 9 * 60
      ? 'morning'
      : !weekend && p.minutes >= 14 * 60 + 31 && p.minutes < 15 * 60
        ? 'afternoon'
        : null;
  return session && !completed.includes(`${p.date}-${session}`)
    ? { session, id: `${p.date}-${session}` }
    : null;
}
