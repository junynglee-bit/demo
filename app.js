import { computeDday, parseDate, sortEvents, toDateString } from "./dday.js";

const STORAGE_KEY = "dday-counter:events";

const form = document.querySelector("#event-form");
const titleInput = document.querySelector("#title");
const dateInput = document.querySelector("#date");
const repeatInput = document.querySelector("#repeat");
const countFromOneInput = document.querySelector("#count-from-one");
const list = document.querySelector("#event-list");
const emptyState = document.querySelector("#empty");
const todayLabel = document.querySelector("#today");

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => e && parseDate(e.date)) : [];
  } catch {
    return [];
  }
}

function saveEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // 저장소를 쓸 수 없는 환경(시크릿 모드 등)에서는 메모리에만 유지
  }
}

let events = loadEvents();

function formatDate(str) {
  const { y, m, d } = parseDate(str);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${y}. ${m}. ${d}. (${weekday})`;
}

function render() {
  const today = toDateString(new Date());
  todayLabel.textContent = `오늘 ${formatDate(today)}`;

  list.replaceChildren();
  emptyState.hidden = events.length > 0;

  for (const { event, info } of sortEvents(events, today)) {
    const li = document.createElement("li");
    li.className = "event";
    if (info.days === 0) li.classList.add("is-today");
    else if (info.days < 0) li.classList.add("is-past");

    const body = document.createElement("div");
    body.className = "event-body";

    const title = document.createElement("h3");
    title.textContent = event.title;

    const meta = document.createElement("p");
    meta.className = "event-meta";
    const tags = [];
    if (event.repeat) tags.push("매년 반복");
    if (event.countFromOne) tags.push("1일부터 계산");
    meta.textContent = formatDate(info.targetDate) + (tags.length ? ` · ${tags.join(" · ")}` : "");

    body.append(title, meta);

    const badge = document.createElement("span");
    badge.className = "event-badge";
    badge.textContent = info.label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "event-remove";
    remove.setAttribute("aria-label", `${event.title} 삭제`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      events = events.filter((e) => e.id !== event.id);
      saveEvents();
      render();
    });

    li.append(body, badge, remove);
    list.append(li);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const date = dateInput.value;
  if (!title || !parseDate(date)) return;

  events.push({
    id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
    title,
    date,
    repeat: repeatInput.checked,
    countFromOne: countFromOneInput.checked,
  });
  saveEvents();
  form.reset();
  titleInput.focus();
  render();
});

// 자정이 지나면 날짜가 바뀌므로 주기적으로 다시 그림
let lastRenderedDay = toDateString(new Date());
setInterval(() => {
  const now = toDateString(new Date());
  if (now !== lastRenderedDay) {
    lastRenderedDay = now;
    render();
  }
}, 60 * 1000);

render();
