export type Section = "morning" | "afternoon" | "evening";
export type Cat = "" | "run" | "ml" | "dsa" | "proj";
export interface Task { id: string; title: string; desc: string; time: string; section: Section; mandatory: boolean; cat: Cat }
export interface Day { done: string[]; snap?: Task[]; a: string; d: string; p: string }
export interface Settings { minStreak: number; runDays: number[] }
export interface State { tasks: Task[]; days: Record<string, Day>; settings: Settings }

const T = (id: string, title: string, time: string, section: Section, mandatory: boolean, desc = "", cat: Cat = ""): Task =>
  ({ id, title, time, section, mandatory, desc, cat });

export const DEFAULT_TASKS: Task[] = [
  T("m1", "Wake up", "6:30 AM", "morning", true),
  T("m2", "Drink water and freshen up", "6:30–6:40 AM", "morning", false),
  T("m3", "Running session", "6:40–7:10 AM", "morning", true, "Run/walk. On non-running days this becomes a recovery walk.", "run"),
  T("m4", "Cool down and recovery", "7:10–7:20 AM", "morning", false),
  T("m5", "Shower", "7:20–7:45 AM", "morning", false),
  T("m6", "Breakfast", "7:45–8:15 AM", "morning", true),
  T("m7", "Review today's priorities", "8:15–8:30 AM", "morning", false),
  T("m8", "Prepare bag and leave", "8:30–8:45 AM", "morning", true),
  T("a1", "Attend college classes", "9:00 AM–4:20 PM", "afternoon", true, "DSA, Java, OS, DDCO, Maths, GIT and labs."),
  T("a2", "Complete important assignments", "Flexible", "afternoon", false),
  T("a3", "Use free periods productively", "Flexible", "afternoon", false, "Revise, DSA, ML concepts, or rest."),
  T("a4", "Revise one college subject", "Flexible", "afternoon", false),
  T("a5", "Lunch and hydration", "Lunchtime", "afternoon", true),
  T("a6", "Return and recover", "4:20–5:00 PM", "afternoon", false),
  T("e1", "CampusX Machine Learning", "5:20–6:05 PM", "evening", true, "Continue the current lesson, take notes, record questions.", "ml"),
  T("e2", "DSA practice", "6:20–6:50 PM", "evening", true, "Log problem name, topic and difficulty in notes.", "dsa"),
  T("e3", "Project development / GSoC", "7:30–8:15 PM", "evening", true, "ML project, library exploration, tests, docs, or open source.", "proj"),
  T("e4", "Paid internship preparation", "8:30–8:45 PM", "evening", false, "Review openings, apply, track applications."),
  T("e5", "College revision", "8:45–9:30 PM", "evening", true, "Pending assignments, or Python/SQL if nothing is due."),
  T("e6", "Plan tomorrow", "9:30–9:45 PM", "evening", true, "Pick tomorrow's three most important tasks."),
  T("e7", "Wind down and sleep", "9:45–10:30 PM", "evening", true, "Prepare clothes and materials, cut screens. Bedtime 10:30 PM."),
];

export const DEFAULT_STATE: State = { tasks: DEFAULT_TASKS, days: {}, settings: { minStreak: 6, runDays: [1, 3, 6] } };

export const emptyDay = (): Day => ({ done: [], a: "", d: "", p: "" });
const pad = (n: number) => String(n).padStart(2, "0");
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parseDate(s); d.setDate(d.getDate() + n); return localDate(d); };

const KEY = "akshay-mission-control-v1";
export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); if (p.tasks && p.days && p.settings) return p as State; }
  } catch { /* fall through */ }
  return DEFAULT_STATE;
}
export function save(s: State) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ } }

export const QUOTES = [
  "Small progress every day creates extraordinary results.",
  "Discipline is choosing what you want most over what you want now.",
  "Consistency beats intensity. Show up again today.",
  "Depth in the fundamentals is what makes an ML engineer.",
  "Be patient: skills compound quietly, then suddenly.",
  "Build something small today that your future self will use.",
  "Rest is part of training. Sleep on time.",
  "Every problem solved is a pattern learned for the interview.",
];
export const quoteFor = (date: string) => QUOTES[[...date].reduce((a, c) => a + c.charCodeAt(0), 0) % QUOTES.length];
