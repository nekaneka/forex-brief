import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dueSession, viennaParts } from "../lib/schedule.mjs";

test("06:30 and 13:30 Vienna starts follow winter, summer and DST changes", () => {
  const cases = [
    ["2026-01-12T05:30:00Z", "morning"],
    ["2026-01-12T12:30:00Z", "afternoon"],
    ["2026-07-13T04:30:00Z", "morning"],
    ["2026-07-13T11:30:00Z", "afternoon"],
    ["2026-03-27T05:30:00Z", "morning"],
    ["2026-03-30T04:30:00Z", "morning"],
    ["2026-03-30T11:30:00Z", "afternoon"],
    ["2026-10-23T04:30:00Z", "morning"],
    ["2026-10-26T05:30:00Z", "morning"],
    ["2026-10-26T12:30:00Z", "afternoon"],
  ];
  for (const [instant, session] of cases) {
    const now = new Date(instant);
    assert.deepEqual(dueSession(now), {
      session,
      id: `${instant.slice(0, 10)}-${session}`,
    });
    const local = viennaParts(now);
    assert.equal(
      `${local.hour}:${local.minute}`,
      session === "morning" ? "06:30" : "13:30",
    );
  }
});

test("schedule rejects early, late, weekend and duplicate sessions but allows retries", () => {
  for (const hour of ["04", "11"]) {
    assert.equal(dueSession(new Date(`2026-07-13T${hour}:29:59Z`)), null);
    for (const minute of ["30", "40", "50", "59"]) {
      assert.ok(dueSession(new Date(`2026-07-13T${hour}:${minute}:00Z`)));
    }
    const nextHour = String(Number(hour) + 1).padStart(2, "0");
    assert.equal(dueSession(new Date(`2026-07-13T${nextHour}:00:00Z`)), null);
    for (const day of ["18", "19"]) {
      assert.equal(dueSession(new Date(`2026-07-${day}T${hour}:30:00Z`)), null);
    }
  }
  const completed = ["2026-07-13-morning"];
  assert.equal(dueSession(new Date("2026-07-13T04:40:00Z"), completed), null);
  assert.equal(
    dueSession(new Date("2026-07-13T11:30:00Z"), completed).session,
    "afternoon",
  );
  assert.equal(
    dueSession(new Date("2026-07-14T04:30:00Z"), completed).id,
    "2026-07-14-morning",
  );
  assert.equal(dueSession(new Date("2026-07-13T06:03:00Z")), null);
  assert.equal(dueSession(new Date("2026-07-13T12:33:00Z")), null);
});

test("actual workflow UTC triggers yield exactly two deduplicated weekday sessions all year", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/research.yml", import.meta.url),
    "utf8",
  );
  const crons = [...workflow.matchAll(/- cron: '([^']+)'/g)].map(([, cron]) => {
    const [minutes, hours, dayOfMonth, month, weekday] = cron.split(" ");
    assert.equal(dayOfMonth, "*");
    assert.equal(month, "*");
    assert.equal(weekday, "1-5");
    return {
      minutes: minutes.split(",").map(Number),
      hours: hours.split(",").map(Number),
    };
  });
  assert.equal(crons.length, 2);
  for (
    let day = Date.UTC(2026, 0, 1);
    day < Date.UTC(2027, 0, 1);
    day += 86400000
  ) {
    const date = new Date(day);
    const weekday = date.getUTCDay() >= 1 && date.getUTCDay() <= 5;
    const completed = [];
    const starts = [];
    const attempts = [];
    for (const cron of crons) {
      for (const hour of cron.hours) {
        for (const minute of cron.minutes)
          attempts.push(day + hour * 3600000 + minute * 60000);
      }
    }
    for (const instant of attempts.sort((a, b) => a - b)) {
      if (!weekday) continue; // The workflow excludes weekends before the runner starts.
      const now = new Date(instant);
      const run = dueSession(now, completed);
      if (!run) continue;
      completed.push(run.id);
      const local = viennaParts(now);
      starts.push(`${run.session}@${local.hour}:${local.minute}`);
    }
    assert.deepEqual(
      starts,
      weekday ? ["morning@06:30", "afternoon@13:30"] : [],
      date.toISOString(),
    );
  }
});
