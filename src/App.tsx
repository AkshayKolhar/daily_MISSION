import { useEffect, useMemo, useRef, useState } from "react";
import { Sunrise, School, Cpu, Plus, Pencil, Trash2, Check, Download, Upload, X, Flame, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Cat, Day, Section, State, Task, addDays, emptyDay, load, localDate, parseDate, quoteFor, save, DEFAULT_TASKS } from "./lib";

type Tab = "today" | "history" | "progress" | "settings";
const SECTIONS: { id: Section; title: string; sub: string; Icon: typeof Sunrise; color: string }[] = [
  { id: "morning", title: "MORNING", sub: "Fitness, health, and discipline", Icon: Sunrise, color: "bg-amber-400" },
  { id: "afternoon", title: "AFTERNOON", sub: "College, assignments, and academic development", Icon: School, color: "bg-sky-400" },
  { id: "evening", title: "EVENING", sub: "AI/ML, DSA, projects, and career preparation", Icon: Cpu, color: "bg-violet-400" },
];
const card = "rounded-2xl border border-slate-800 bg-slate-900/70";
const btn = "rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800 inline-flex items-center gap-1.5";

function Bar({ pct, color = "bg-emerald-400" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Editor({ init, isNew, onSave, onDelete, onClose }: { init: Task; isNew: boolean; onSave: (t: Task) => void; onDelete: (id: string) => void; onClose: () => void }) {
    const [t, setT] = useState(init);
    const f = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5";
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Edit task">
        <div className={`${card} max-h-full w-full max-w-md overflow-auto bg-slate-900 p-5`}>
          <div className="mb-3 flex justify-between"><h2 className="font-semibold">{isNew ? "New task" : "Edit task"}</h2><button aria-label="Close" onClick={onClose}><X size={18} /></button></div>
          <label className="mb-3 block text-sm">Name<input className={f} value={t.title} onChange={e => setT({ ...t, title: e.target.value })} autoFocus /></label>
          <label className="mb-3 block text-sm">Description<textarea rows={2} className={f} value={t.desc} onChange={e => setT({ ...t, desc: e.target.value })} /></label>
          <label className="mb-3 block text-sm">Time<input className={f} value={t.time} onChange={e => setT({ ...t, time: e.target.value })} /></label>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="text-sm">Section<select className={f} value={t.section} onChange={e => setT({ ...t, section: e.target.value as Section })}>{SECTIONS.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
            <label className="text-sm">Counts toward<select className={f} value={t.cat} onChange={e => setT({ ...t, cat: e.target.value as Cat })}><option value="">Nothing</option><option value="run">Running</option><option value="ml">ML</option><option value="dsa">DSA</option><option value="proj">Project/GSoC</option></select></label>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={t.mandatory} onChange={e => setT({ ...t, mandatory: e.target.checked })} /> Mandatory</label>
          <p className="mb-3 text-xs text-slate-500">Changes apply to today and future days. Past days keep their original tasks.</p>
          <div className="flex justify-between">
            {!isNew ? <button className={`${btn} text-red-300`} onClick={() => onDelete(t.id)}><Trash2 size={15} /> Delete</button> : <span />}
            <button className={`${btn} bg-emerald-500 text-slate-900 hover:bg-emerald-400`} disabled={!t.title.trim()} onClick={() => onSave({ ...t, title: t.title.trim() })}>Save</button>
          </div>
        </div>
      </div>
    );
  }

export default function App() {
  const [s, setS] = useState<State>(load);
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState<Tab>("today");
  const [sel, setSel] = useState<string | null>(null); // null = follow today
  const [editing, setEditing] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => save(s), [s]);
  const today = localDate(now);
  const date = sel ?? today;

  // Freeze the task list for past days that have records, so later template edits don't rewrite history.
  useEffect(() => {
    setS(p => {
      const need = Object.keys(p.days).filter(d => d < today && !p.days[d].snap);
      if (!need.length) return p;
      const days = { ...p.days };
      need.forEach(d => (days[d] = { ...days[d], snap: p.tasks }));
      return { ...p, days };
    });
  }, [today]);

  const tasksFor = (d: string): Task[] => {
    const base = d < today && s.days[d]?.snap ? s.days[d].snap! : s.tasks;
    const dow = parseDate(d).getDay();
    return base.map(t => t.cat === "run" && !s.settings.runDays.includes(dow) ? { ...t, title: "Recovery walk / mobility" } : t);
  };
  const doneSet = (d: string) => new Set(s.days[d]?.done ?? []);
  const stats = (d: string) => {
    const tasks = tasksFor(d), ds = doneSet(d);
    const done = tasks.filter(t => ds.has(t.id));
    const mand = tasks.filter(t => t.mandatory);
    return { tasks, done, mand, mandDone: mand.filter(t => ds.has(t.id)).length, pct: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0 };
  };
  const met = (d: string) => { const st = stats(d); return st.mandDone >= Math.min(Math.max(s.settings.minStreak, 1), st.mand.length || 1) && st.mandDone > 0; };

  const patchDay = (d: string, f: (x: Day) => Day) => setS(p => ({ ...p, days: { ...p.days, [d]: f(p.days[d] ?? emptyDay()) } }));
  const toggle = (id: string) => patchDay(date, x => ({ ...x, done: x.done.includes(id) ? x.done.filter(i => i !== id) : [...x.done, id] }));
  const saveTask = (t: Task, isNew: boolean) => setS(p => ({ ...p, tasks: isNew ? [...p.tasks, t] : p.tasks.map(o => (o.id === t.id ? t : o)) }));
  const deleteTask = (id: string) => setS(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
  const newTask = (section: Section): Task => ({ id: "c" + Date.now(), title: "", desc: "", time: "Flexible", section, mandatory: false, cat: "" });

  const streaks = useMemo(() => {
    let cur = 0, d = today;
    if (!met(d)) d = addDays(d, -1);
    while (met(d)) { cur++; d = addDays(d, -1); }
    let best = 0, run = 0, prev = "";
    Object.keys(s.days).sort().forEach(k => {
      if (!met(k)) { run = 0; prev = ""; return; }
      run = prev && addDays(prev, 1) === k ? run + 1 : 1; prev = k; best = Math.max(best, run);
    });
    return { cur, best: Math.max(best, cur) };
  }, [s, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportData = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }));
    a.download = `mission-control-backup-${today}.json`; a.click();
  };
  const importData = async (f?: File) => {
    if (!f) return;
    try {
      const p = JSON.parse(await f.text());
      if (!Array.isArray(p.tasks) || typeof p.days !== "object" || !p.settings) throw new Error();
      setS(p as State); setMsg("Import successful.");
    } catch { setMsg("Import failed: that file is not a valid backup."); }
  };

  const hour = now.getHours();
  const greet = hour < 5 ? "Good Night" : hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : hour < 21 ? "Good Evening" : "Good Night";
  const st = stats(date);
  const allMandDone = st.mand.length > 0 && st.mandDone === st.mand.length;
  const dateLabel = parseDate(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // ---- views ----
  const Checklist = () => (
    <div className="space-y-5">
      {SECTIONS.map(sec => {
        const list = st.tasks.filter(t => t.section === sec.id);
        const d = list.filter(t => doneSet(date).has(t.id)).length;
        const pct = list.length ? Math.round((d / list.length) * 100) : 0;
        return (
          <section key={sec.id} className={`${card} p-4 sm:p-5`} aria-label={sec.title}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 text-slate-900 ${sec.color}`}><sec.Icon size={20} /></div>
                <div><h2 className="font-semibold tracking-wide">{sec.title}</h2><p className="text-sm text-slate-400">{sec.sub}</p></div>
              </div>
              <div className="text-right text-sm text-slate-300">{d}/{list.length} tasks completed</div>
            </div>
            <div className="my-3"><Bar pct={pct} color={sec.color} /></div>
            {list.length === 0 && <p className="py-3 text-sm text-slate-500">No tasks here yet. Add one below.</p>}
            <ul className="space-y-1.5">
              {list.map(t => {
                const on = doneSet(date).has(t.id);
                return (
                  <li key={t.id} className="group flex items-start gap-3 rounded-xl p-2 hover:bg-slate-800/60">
                    <button role="checkbox" aria-checked={on} aria-label={`Mark ${t.title} as ${on ? "not done" : "done"}`} onClick={() => toggle(t.id)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? "border-emerald-400 bg-emerald-400 text-slate-900" : "border-slate-600"}`}>
                      {on && <Check size={16} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium ${on ? "text-slate-500 line-through" : ""}`}>{t.title}{!t.mandatory && <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs font-normal text-slate-400">optional</span>}</div>
                      <div className="text-xs text-slate-400">{t.time}</div>
                      {t.desc && <div className="mt-0.5 text-sm text-slate-400">{t.desc}</div>}
                    </div>
                    <button className="rounded p-1.5 text-slate-400 hover:bg-slate-700" aria-label={`Edit ${t.title}`} onClick={() => setEditing({ task: s.tasks.find(x => x.id === t.id)!, isNew: false })}><Pencil size={15} /></button>
                  </li>
                );
              })}
            </ul>
            <button className={`${btn} mt-3`} onClick={() => setEditing({ task: newTask(sec.id), isNew: true })}><Plus size={15} /> Add task</button>
          </section>
        );
      })}
      <section className={`${card} p-4 sm:p-5`}>
        <h2 className="mb-3 font-semibold tracking-wide">DAILY REFLECTION</h2>
        {([["a", "What did I accomplish today?"], ["d", "What distracted me today?"], ["p", "What are my top three priorities for tomorrow?"]] as const).map(([k, label]) => (
          <label key={k} className="mb-3 block text-sm text-slate-300">{label}
            <textarea rows={2} value={s.days[date]?.[k] ?? ""} onChange={e => patchDay(date, x => ({ ...x, [k]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100" />
          </label>
        ))}
      </section>
    </div>
  );

  const Today = () => (
    <>
      <div className={`${card} mb-5 p-4 sm:p-5`}>
        <div className="mb-2 flex items-end justify-between"><span className="text-sm text-slate-400">Daily completion</span><span className="text-2xl font-bold">{st.pct}%</span></div>
        <Bar pct={st.pct} />
        <p className="mt-2 text-sm text-slate-400">{st.done.length}/{st.tasks.length} tasks, mandatory {st.mandDone}/{st.mand.length}</p>
        {allMandDone && <p className="mt-2 rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-300">All mandatory tasks done. Great discipline today. Rest well.</p>}
      </div>
      {Checklist()}
    </>
  );

  const History = () => (
    <div>
      <div className={`${card} mb-5 flex flex-wrap items-center gap-2 p-4`}>
        <button className={btn} aria-label="Previous day" onClick={() => setSel(addDays(date, -1))}><ChevronLeft size={16} /></button>
        <input type="date" max={today} value={date} onChange={e => e.target.value && setSel(e.target.value === today ? null : e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm" aria-label="Select date" />
        <button className={btn} aria-label="Next day" disabled={date >= today} onClick={() => setSel(addDays(date, 1) >= today ? null : addDays(date, 1))}><ChevronRight size={16} /></button>
        <span className="text-sm text-slate-400">{dateLabel}: {st.pct}% complete</span>
      </div>
      {!s.days[date] && date !== today && <p className="mb-4 text-sm text-slate-500">No record exists for this date. Anything you tick will create one.</p>}
      {Checklist()}
    </div>
  );

  const Progress = () => {
    const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const rec = week.filter(d => s.days[d]);
    const count = (c: Cat) => week.reduce((n, d) => n + stats(d).done.filter(t => t.cat === c).length, 0);
    const total = week.reduce((n, d) => n + stats(d).done.length, 0);
    const avg = Math.round(week.reduce((n, d) => n + stats(d).pct, 0) / 7);
    const consistency = Math.round((week.filter(met).length / 7) * 100);
    const tiles: [string, string | number][] = [["Today", `${stats(today).pct}%`], ["Weekly average", `${avg}%`], ["Tasks this week", total], ["Running sessions", count("run")], ["ML sessions", count("ml")], ["DSA sessions", count("dsa")], ["Project/GSoC", count("proj")], ["Consistency", `${consistency}%`]];
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map(([k, v]) => <div key={k} className={`${card} p-4`}><div className="text-2xl font-bold">{v}</div><div className="text-xs text-slate-400">{k}</div></div>)}
        </div>
        <div className={`${card} p-4 sm:p-5`}>
          <h2 className="mb-4 font-semibold tracking-wide">LAST 7 DAYS</h2>
          {rec.length === 0 ? <p className="text-sm text-slate-500">Your progress will appear here as you complete tasks.</p> : (
            <div className="flex h-44 items-end gap-2">
              {week.map(d => { const p = stats(d).pct; return (
                <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs text-slate-400">{p}%</span>
                  <div className="w-full rounded-t-md bg-emerald-400 transition-all duration-500" style={{ height: `${Math.max(p, 2)}%`, opacity: s.days[d] ? 1 : 0.2 }} />
                  <span className="text-xs text-slate-500">{parseDate(d).toLocaleDateString("en-US", { weekday: "short" })}</span>
                </div>); })}
            </div>
          )}
        </div>
        <div className={`${card} flex items-center gap-6 p-4 sm:p-5`}>
          <Flame className="text-orange-400" />
          <div><div className="text-2xl font-bold">{streaks.cur} days</div><div className="text-xs text-slate-400">Current streak</div></div>
          <div><div className="text-2xl font-bold">{streaks.best} days</div><div className="text-xs text-slate-400">Best streak</div></div>
          <div><div className="text-2xl font-bold">{week.filter(met).length}/7</div><div className="text-xs text-slate-400">Days completed this week</div></div>
        </div>
      </div>
    );
  };

  const Settings = () => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="space-y-5">
        <div className={`${card} p-4 sm:p-5`}>
          <h2 className="mb-3 font-semibold">Running days</h2>
          <div className="flex flex-wrap gap-2">
            {names.map((n, i) => { const on = s.settings.runDays.includes(i); return (
              <button key={n} aria-pressed={on} className={`${btn} ${on ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : ""}`}
                onClick={() => setS(p => ({ ...p, settings: { ...p.settings, runDays: on ? p.settings.runDays.filter(x => x !== i) : [...p.settings.runDays, i] } }))}>{n}</button>); })}
          </div>
          <p className="mt-2 text-xs text-slate-500">On other days the running task becomes a recovery walk.</p>
        </div>
        <div className={`${card} p-4 sm:p-5`}>
          <label className="block text-sm">Mandatory tasks needed for a streak day
            <input type="number" min={1} value={s.settings.minStreak} onChange={e => setS(p => ({ ...p, settings: { ...p.settings, minStreak: Math.max(1, Number(e.target.value) || 1) } }))}
              className="ml-3 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1" />
          </label>
        </div>
        <div className={`${card} p-4 sm:p-5`}>
          <h2 className="mb-2 font-semibold">Data</h2>
          <p className="mb-3 text-sm text-slate-400">Everything is stored only in this browser's localStorage. Clearing browser data deletes your records, so export backups regularly.</p>
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={exportData}><Download size={15} /> Export JSON</button>
            <button className={btn} onClick={() => fileRef.current?.click()}><Upload size={15} /> Import JSON</button>
            <button className={btn} onClick={() => confirm("Restore default tasks? History is kept.") && setS(p => ({ ...p, tasks: DEFAULT_TASKS }))}><RotateCcw size={15} /> Restore default schedule</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={e => { importData(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {msg && <p className="mt-3 text-sm text-sky-300" role="status">{msg}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-emerald-400">AKSHAY'S DAILY MISSION CONTROL</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{greet.toUpperCase()}, AKSHAY 👋</h1>
          <p className="mt-1 text-sm uppercase text-slate-400">{dateLabel} · {now.toLocaleTimeString("en-US")}</p>
          <p className="mt-2 text-slate-300">"{quoteFor(today)}"</p>
        </header>
        <nav className="mb-5 flex gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1" aria-label="Main">
          {(["today", "history", "progress", "settings"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === "today") setSel(null); }} aria-current={tab === t}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium uppercase ${tab === t ? "bg-slate-700" : "text-slate-400 hover:bg-slate-800"}`}>{t}</button>
          ))}
        </nav>
        {tab === "today" && Today()}
        {tab === "history" && History()}
        {tab === "progress" && Progress()}
        {tab === "settings" && Settings()}
        {editing && <Editor key={editing.task.id} init={editing.task} isNew={editing.isNew} onClose={() => setEditing(null)} onSave={t => { saveTask(t, editing.isNew); setEditing(null); }} onDelete={id => { deleteTask(id); setEditing(null); }} />}
      </div>
    </div>
  );
}
