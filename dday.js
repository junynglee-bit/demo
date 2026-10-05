// D-Day 계산 로직 (DOM 의존성 없음 — 브라우저와 Node 양쪽에서 사용)

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" 문자열을 {y, m, d}로 파싱. 유효하지 않으면 null. */
export function parseDate(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str ?? "");
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

/** Date 객체의 로컬 날짜를 "YYYY-MM-DD"로 변환. */
export function toDateString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// UTC 기준 일수로 변환해 서머타임 영향을 받지 않도록 함
function toDayNumber({ y, m, d }) {
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** target까지 남은 일수 (지났으면 음수). */
export function daysBetween(today, target) {
  return toDayNumber(target) - toDayNumber(today);
}

/** 매년 반복되는 날짜의 다음 발생일 (오늘 포함). 2/29는 평년에 2/28로 처리. */
export function nextOccurrence(today, { m, d }) {
  const forYear = (y) => ({ y, m, d: m === 2 && d === 29 && !isLeapYear(y) ? 28 : d });
  const thisYear = forYear(today.y);
  return daysBetween(today, thisYear) >= 0 ? thisYear : forYear(today.y + 1);
}

/**
 * 이벤트의 D-Day 정보를 계산.
 * @param {{date: string, repeat?: boolean, countFromOne?: boolean}} event
 * @param {string} todayStr "YYYY-MM-DD"
 * @returns {{label: string, days: number, targetDate: string}}
 */
export function computeDday(event, todayStr) {
  const today = parseDate(todayStr);
  let target = parseDate(event.date);
  if (!today || !target) throw new Error("유효하지 않은 날짜입니다");

  if (event.repeat) target = nextOccurrence(today, target);

  const days = daysBetween(today, target);
  const pad = (n) => String(n).padStart(2, "0");
  const targetDate = `${target.y}-${pad(target.m)}-${pad(target.d)}`;

  let label;
  if (days > 0) label = `D-${days}`;
  else if (days === 0) label = "D-Day";
  else if (event.countFromOne) label = `${-days + 1}일째`;
  else label = `D+${-days}`;

  return { label, days, targetDate };
}

/** 정렬: 다가오는 일정(가까운 순) → 지난 일정(최근 순). */
export function sortEvents(events, todayStr) {
  return events
    .map((event) => ({ event, info: computeDday(event, todayStr) }))
    .sort((a, b) => {
      const aPast = a.info.days < 0;
      const bPast = b.info.days < 0;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return aPast ? b.info.days - a.info.days : a.info.days - b.info.days;
    });
}
