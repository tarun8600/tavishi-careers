"use client";
import { countryOptions, DEFAULT_COUNTRY, PINNED } from "@/lib/design/countries";

const OPTIONS = countryOptions();

export function CountrySelector({ value = DEFAULT_COUNTRY, onChange, label = "Country" }: { value?: string; onChange: (code: string) => void; label?: string }) {
  return (
    <label className="tc-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <optgroup label="Popular">
          {OPTIONS.filter((o) => PINNED.includes(o.code)).map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
        </optgroup>
        <optgroup label="All countries">
          {OPTIONS.filter((o) => !PINNED.includes(o.code)).map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
        </optgroup>
      </select>
    </label>
  );
}
