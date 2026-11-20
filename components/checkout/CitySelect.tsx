"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

interface Props {
  id: string;
  value: string;
  options: readonly string[];
  onChange: (city: string) => void;
}

/** Type-to-search city picker (accessible combobox). Only an exact list entry can be selected. */
export function CitySelect({ id, value, options, onChange }: Props) {
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => { setText(value); }, [value]); // keep in step with the selected city (e.g. form reset)

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q || text === value) return options; // showing the full list when nothing is being searched
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [text, value, options]);

  useEffect(() => { setActive(0); }, [text]);
  useEffect(() => {
    if (open) wrap.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (city: string) => { onChange(city); setText(city); setOpen(false); };
  const close = () => { setOpen(false); setText(value); }; // unfinished text falls back to the chosen city

  return (
    <div className="city-select" ref={wrap} onBlur={(e) => { if (!wrap.current?.contains(e.relatedTarget as Node)) close(); }}>
      <input
        id={id} type="text" role="combobox" autoComplete="off" spellCheck={false}
        aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        placeholder="Search or choose your city…" value={text}
        onFocus={(e) => { setOpen(true); e.currentTarget.select(); }}
        onClick={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { if (open && matches[active]) { e.preventDefault(); choose(matches[active]); } }
          else if (e.key === "Escape") { if (open) { e.preventDefault(); close(); } }
        }}
      />
      {open && (
        <ul className="city-select-list" id={listId} role="listbox" aria-label="Cities">
          {matches.length === 0 && <li className="city-select-empty" role="presentation">No city found</li>}
          {matches.map((c, i) => (
            <li
              key={c} id={`${listId}-${i}`} data-idx={i} role="option" aria-selected={c === value}
              className={`city-select-option${i === active ? " is-active" : ""}${c === value ? " is-selected" : ""}`}
              onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)} onMouseEnter={() => setActive(i)}
            >{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
