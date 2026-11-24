'use client';

import { Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { PlanSession } from './types';

export function FamilyEditor({ session }: { session: PlanSession }) {
  const { input, result, onChange, stale } = session;
  if (!input) return null;
  function addChild() {
    if (!input || input.starting_ages.length >= 50) return;
    onChange('starting_ages', [...input.starting_ages, 0]);
    onChange('degree_years', [...input.degree_years, '4']);
    onChange('first_college_years', [...input.first_college_years, null]);
    onChange('graduation_dates', [...input.graduation_dates, null]);
  }
  function removeChild(index: number) {
    if (!input) return;
    onChange('starting_ages', input.starting_ages.filter((_, i) => i !== index));
    onChange('degree_years', input.degree_years.filter((_, i) => i !== index));
    onChange('first_college_years', input.first_college_years.filter((_, i) => i !== index));
    onChange('graduation_dates', input.graduation_dates.filter((_, i) => i !== index));
  }
  return <fieldset className="space-y-3">
    <legend className="mb-2 text-sm font-semibold text-navy-900">Children <span className="font-normal text-slate-500">({input.starting_ages.length})</span></legend>
    {input.starting_ages.length === 0 && <p className="text-sm text-slate-600">Add a child to begin your family plan.</p>}
    {input.starting_ages.map((age, index) => {
      const child = !stale ? result?.beneficiaries[index] : undefined;
      return <section key={index} aria-label={`Child ${index + 1} settings`} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-navy-900">Child {index + 1}</h3>
          {input.family_mode === 'custom' && <button type="button" onClick={() => removeChild(index)} aria-label={`Remove child ${index + 1}`} className="grid size-9 place-items-center rounded-md text-rose-700 hover:bg-rose-50"><Trash2 className="size-4"/></button>}
        </div>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-700" htmlFor={`age-${index + 1}`}>Age at model start
          <input id={`age-${index + 1}`} type="number" min="0" max="100" step="1" required value={Number.isFinite(age) ? age : ''}
            onChange={e => onChange('starting_ages', input.starting_ages.map((a, i) => i === index ? (e.target.value === '' ? NaN : Number(e.target.value)) : a))}
            className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base tabular-nums"/>
        </label><label className="text-sm text-slate-700" htmlFor={`degree-${index + 1}`}>Degree years
          <input id={`degree-${index + 1}`} type="number" min="0.5" max="100" step="0.5" required value={input.degree_years[index]}
            onChange={e => onChange('degree_years', input.degree_years.map((v, i) => i === index ? e.target.value : v))}
            className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base tabular-nums"/>
        </label></div>
        <details className="text-sm text-slate-700"><summary className="cursor-pointer font-medium">College calendar overrides</summary>
          <div className="mt-3 space-y-3"><label className="block" htmlFor={`college-year-${index + 1}`}>First fall payment year <span className="text-xs text-slate-500">(optional)</span>
            <input id={`college-year-${index + 1}`} type="number" min="1900" max="2300" step="1" disabled={!input.model_start_date}
              placeholder={child?.first_college_year ? `Auto: ${child.first_college_year}` : 'Automatic after age 18'} value={input.first_college_years[index] ?? ''}
              onChange={e => onChange('first_college_years', input.first_college_years.map((v, i) => i === index ? (e.target.value ? Number(e.target.value) : null) : v))}
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base disabled:bg-slate-100"/>
          </label><label className="block" htmlFor={`graduation-${index + 1}`}>Graduation date <span className="text-xs text-slate-500">(optional override)</span>
            <input id={`graduation-${index + 1}`} type="date" disabled={!input.model_start_date} value={input.graduation_dates[index] ?? ''}
              onChange={e => onChange('graduation_dates', input.graduation_dates.map((v, i) => i === index ? e.target.value || null : v))}
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-base disabled:bg-slate-100"/>
          </label><p className="text-xs leading-relaxed text-slate-600">{!input.model_start_date ? 'Choose a model start date to use overrides.' : child?.graduation_date ? `Current graduation: ${formatDate(child.graduation_date)}. ` : ''}Leave blank for the first August 1 on or after age 18 and an estimated May 31 / December 31 graduation. A later final semester requires a longer degree.</p></div>
        </details>
      </section>;
    })}
    {input.family_mode === 'custom' && <button type="button" disabled={input.starting_ages.length >= 50} onClick={addChild} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-teal-300 bg-white px-4 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:opacity-50"><Plus className="size-4"/>Add child</button>}
    <p className="text-xs leading-relaxed text-slate-600">Ages are whole years, assumed exact at model start. Use half-year degree increments. Children already over 18 need a model start date so past college payments can be excluded.</p>
  </fieldset>;
}
