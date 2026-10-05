import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDday, parseDate, sortEvents } from "../dday.js";

test("parseDate rejects invalid dates", () => {
  assert.deepEqual(parseDate("2026-10-05"), { y: 2026, m: 10, d: 5 });
  assert.equal(parseDate("2026-02-30"), null);
  assert.equal(parseDate("2026/10/05"), null);
  assert.equal(parseDate(""), null);
});

test("future, today, and past labels", () => {
  assert.equal(computeDday({ date: "2026-10-15" }, "2026-10-05").label, "D-10");
  assert.equal(computeDday({ date: "2026-10-05" }, "2026-10-05").label, "D-Day");
  assert.equal(computeDday({ date: "2026-10-01" }, "2026-10-05").label, "D+4");
});

test("crosses years and DST boundaries correctly", () => {
  assert.equal(computeDday({ date: "2027-01-01" }, "2026-12-31").label, "D-1");
  assert.equal(computeDday({ date: "2026-11-02" }, "2026-03-01").days, 246);
});

test("countFromOne counts the start date as day 1", () => {
  assert.equal(computeDday({ date: "2026-10-05", countFromOne: true }, "2026-10-05").label, "D-Day");
  assert.equal(computeDday({ date: "2026-10-04", countFromOne: true }, "2026-10-05").label, "2일째");
  assert.equal(computeDday({ date: "2026-07-08", countFromOne: true }, "2026-10-15").label, "100일째");
});

test("repeat uses the next yearly occurrence", () => {
  assert.deepEqual(computeDday({ date: "1990-12-25", repeat: true }, "2026-10-05"), {
    label: "D-81",
    days: 81,
    targetDate: "2026-12-25",
  });
  assert.equal(computeDday({ date: "1990-10-05", repeat: true }, "2026-10-05").label, "D-Day");
  assert.equal(computeDday({ date: "1990-03-01", repeat: true }, "2026-10-05").targetDate, "2027-03-01");
});

test("repeat on Feb 29 falls back to Feb 28 in common years", () => {
  assert.equal(computeDday({ date: "2000-02-29", repeat: true }, "2026-10-05").targetDate, "2027-02-28");
  assert.equal(computeDday({ date: "2000-02-29", repeat: true }, "2027-10-05").targetDate, "2028-02-29");
});

test("sortEvents puts upcoming first (soonest), then past (most recent)", () => {
  const events = [
    { title: "old", date: "2026-01-01" },
    { title: "far", date: "2027-01-01" },
    { title: "recent", date: "2026-10-01" },
    { title: "today", date: "2026-10-05" },
    { title: "soon", date: "2026-10-10" },
  ];
  assert.deepEqual(
    sortEvents(events, "2026-10-05").map(({ event }) => event.title),
    ["today", "soon", "far", "recent", "old"],
  );
});
