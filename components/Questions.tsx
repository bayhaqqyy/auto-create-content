"use client";
import { useState } from "react";
import type { BriefQuestion } from "../lib/types";

/** Daftar pertanyaan pilihan ganda + jawaban sendiri. Pilihan pertama terpilih sebagai rekomendasi. */
export function Questions({
  questions, submitLabel, skipLabel, notePlaceholder, busy, onSubmit,
}: {
  questions: BriefQuestion[];
  submitLabel: string;
  skipLabel?: string;
  notePlaceholder?: string;
  busy?: boolean;
  onSubmit: (answers: Record<string, string>, note: string, skip: boolean) => void;
}) {
  const [pick, setPick] = useState<Record<string, string>>(() => Object.fromEntries(questions.map((q) => [q.id, q.options[0] || "__own"])));
  const [own, setOwn] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const answerOf = (id: string) => (pick[id] === "__own" ? (own[id] || "").trim() : pick[id]);
  const missing = questions.filter((q) => !answerOf(q.id)).length;
  return (
    <div className="stack" style={{ gap: 20 }}>
      {questions.map((q, i) => (
        <fieldset key={q.id} className="card stack" style={{ margin: 0, gap: 10 }}>
          <legend className="h3" style={{ padding: 0, float: "left", width: "100%" }}>{i + 1}. {q.question}</legend>
          {q.why ? <p className="muted small" style={{ margin: 0 }}>{q.why}</p> : null}
          {[...q.options, "__own"].map((o) => (
            <label key={o} className="row" style={{ gap: 10, padding: "10px 14px", borderRadius: 12, border: pick[q.id] === o ? "2px solid var(--navy)" : "1px solid var(--line2)", cursor: "pointer", flexWrap: "nowrap" }}>
              <input type="radio" name={q.id} checked={pick[q.id] === o} onChange={() => setPick({ ...pick, [q.id]: o })} />
              {o === "__own" ? (
                <input className="input" style={{ flex: 1 }} placeholder="Jawaban sendiri…" aria-label={`Jawaban sendiri untuk pertanyaan ${i + 1}`} value={own[q.id] || ""}
                  onFocus={() => setPick({ ...pick, [q.id]: "__own" })} onChange={(e) => setOwn({ ...own, [q.id]: e.target.value })} />
              ) : <span>{o}</span>}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="field">
        <label htmlFor="q-note">Catatan tambahan (opsional)</label>
        <textarea id="q-note" className="textarea" rows={3} placeholder={notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn primary" disabled={busy || missing > 0} onClick={() => onSubmit(Object.fromEntries(questions.map((q) => [q.id, answerOf(q.id)])), note, false)}>{submitLabel}</button>
        {skipLabel ? <button className="btn quiet" disabled={busy} onClick={() => onSubmit({}, note, true)}>{skipLabel}</button> : null}
        {missing ? <span className="muted small">{missing} pertanyaan belum dijawab</span> : null}
      </div>
    </div>
  );
}
