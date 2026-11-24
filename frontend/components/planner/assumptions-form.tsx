'use client';

import type { FormEvent, ReactNode } from 'react';
import { LoaderCircle, RefreshCw, RotateCw } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { Kicker } from './primitives';
import { FamilyEditor } from './family-editor';
import { isServiceUnavailable } from './status-banners';
import type { PlanSession } from './types';

type FieldKey = 'college_annual' | 'adult_minimum' | 'adult_target' | 'degree_years' | 'model_start_date';

/** Match field names in a backend message so the right inputs can be highlighted. */
function fieldsMentioned(message: string): Set<FieldKey> {
  if (!message || isServiceUnavailable(message)) return new Set();
  const text = message.toLowerCase();
  const found = new Set<FieldKey>();
  if (/college[_ ]annual|college allowance/.test(text)) found.add('college_annual');
  if (/adult[_ ]min|minimum/.test(text)) found.add('adult_minimum');
  if (/adult[_ ]target|goal|target/.test(text)) found.add('adult_target');
  if (/degree/.test(text)) found.add('degree_years');
  if (/model[_ ]start|start date/.test(text)) found.add('model_start_date');
  return found;
}

const inputClass = (invalid: boolean) =>
  `h-11 w-full rounded-md border bg-white px-3 text-[15px] tabular-nums text-ink placeholder:text-slate-400 ${
    invalid ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 hover:border-slate-400'
  }`;

function Field({
  id,
  label,
  hint,
  help,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-medium text-navy-900">
        {label}
        {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {help && (
        <p id={`${id}-help`} className="mt-1.5 text-xs leading-relaxed text-slate-600">
          {help}
        </p>
      )}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  min,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        $
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step="0.01"
        required
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={event => onChange(event.target.value)}
        className={`${inputClass(invalid)} pl-7`}
      />
    </div>
  );
}

export function AssumptionsForm({ session }: { session: PlanSession }) {
  const { input, reference, result, loading, error, stale, mode, onChange, onUpdate, onRetry } = session;
  const flagged = fieldsMentioned(error);

  const goalBelowMinimum =
    !!input &&
    input.adult_support_enabled &&
    input.adult_minimum !== '' &&
    input.adult_target !== '' &&
    Number(input.adult_target) < Number(input.adult_minimum);

  function submit(event: FormEvent) {
    event.preventDefault();
    onUpdate();
  }

  return (
    <aside
      id="assumptions"
      aria-labelledby="assumptions-title"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto"
    >
      <div className="bg-navy-900 px-5 py-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300">Your assumptions</p>
        <h2 id="assumptions-title" className="mt-1 font-serif text-2xl">
          Payment settings
        </h2>
        <p className="mt-1 text-sm text-slate-300">Dollars are in model-start purchasing power.</p>
      </div>

      {input ? (
        <form onSubmit={submit} className="space-y-6 px-5 py-6" noValidate={false}>
          <div role="group" aria-label="Family setup" className="grid grid-cols-2 gap-2">
            {(['demo', 'custom'] as const).map(value => <button key={value} type="button"
              disabled={mode === 'illustrative'} aria-pressed={input.family_mode === value}
              onClick={() => session.onFamilyModeChange(value)}
              className={`min-h-11 rounded-md border px-3 text-sm font-medium ${input.family_mode === value ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white text-navy-900'}`}>
              {value === 'demo' ? 'Demo family' : 'Your family'}
            </button>)}
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{input.family_mode === 'demo'
            ? 'Demo: four children aged 8, 6, 4 and 2, $50,000 college allowance, and $20,000 / $200,000 adult minimum / goal. Choose Your family to edit.'
            : 'Add or remove children and set their ages and degree lengths. Your custom settings are retained when you visit the demo.'}</p>
          <Field
            id="model-start"
            label="Model start date"
            hint="Optional"
            help="Choose a date to calculate the academic calendar. Leave blank to show amounts and semester counts only."
          >
            <input
              id="model-start"
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={input.model_start_date ?? ''}
              aria-invalid={flagged.has('model_start_date') || undefined}
              aria-describedby="model-start-help"
              onChange={event => onChange('model_start_date', event.target.value || null)}
              className={inputClass(flagged.has('model_start_date'))}
            />
          </Field>

          <fieldset disabled={input.family_mode === 'demo'} className="space-y-6 disabled:opacity-75">
          <Field
            id="college-annual"
            label="College allowance"
            hint="Per child, per year"
            help="Each funded semester receives half of the CPI-linked annual allowance."
          >
            <MoneyInput
              id="college-annual"
              value={input.college_annual}
              min="1"
              invalid={flagged.has('college_annual')}
              describedBy="college-annual-help"
              onChange={value => onChange('college_annual', value)}
            />
          </Field>

          <FamilyEditor session={session} />

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label htmlFor="adult-support" className="text-sm font-medium text-navy-900">
                  Sustainable adult support
                </label>
                <p id="adult-support-help" className="mt-1 text-xs leading-relaxed text-slate-600">
                  Monthly payments that begin one month after graduation.
                </p>
              </div>
              <button
                id="adult-support"
                type="button"
                role="switch"
                aria-checked={input.adult_support_enabled}
                aria-describedby="adult-support-help"
                onClick={() => onChange('adult_support_enabled', !input.adult_support_enabled)}
                className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
                  input.adult_support_enabled ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span className="sr-only">{input.adult_support_enabled ? 'On' : 'Off'}</span>
                <span
                  aria-hidden
                  className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                    input.adult_support_enabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {input.adult_support_enabled ? (
              <div className="mt-5 space-y-5">
                <Field id="adult-minimum" label="Annual minimum" hint="Per child">
                  <MoneyInput
                    id="adult-minimum"
                    value={input.adult_minimum}
                    min="0"
                    invalid={flagged.has('adult_minimum')}
                    onChange={value => onChange('adult_minimum', value)}
                  />
                </Field>
                <Field
                  id="adult-target"
                  label="Annual goal"
                  hint="Per child"
                  help={
                    goalBelowMinimum ? (
                      <span className="font-medium text-amber-800">
                        The goal is currently below the minimum. The Python service will reject this when you update.
                      </span>
                    ) : (
                      'The goal must be at least the minimum. The Python service validates it on update.'
                    )
                  }
                >
                  <MoneyInput
                    id="adult-target"
                    value={input.adult_target}
                    min="0"
                    invalid={flagged.has('adult_target') || goalBelowMinimum}
                    describedBy="adult-target-help"
                    onChange={value => onChange('adult_target', value)}
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-3 text-xs leading-relaxed text-slate-700">
                <p className="font-semibold text-navy-900">College-only alternative scenario</p>
                <p className="mt-1">
                  No adult payments are active. Your entries are kept (minimum {formatMoney(input.adult_minimum)},
                  goal {formatMoney(input.adult_target)}) and return when you switch support back on. This
                  scenario does not meet the reference trust payment mandate.
                </p>
              </div>
            )}
          </div>

          </fieldset>
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={loading || (mode === 'illustrative')}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-[15px] font-medium text-white transition-colors disabled:opacity-60 ${
                stale ? 'bg-teal-700 hover:bg-teal-800' : 'bg-navy-900 hover:bg-navy-800'
              }`}
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              {loading ? 'Updating…' : 'Update payment plan'}
            </button>
            {mode === 'illustrative' ? (
              <p className="text-xs leading-relaxed text-amber-900">
                Updating is disabled in the illustrative preview. Nothing is calculated here.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-slate-600">
                {stale
                  ? 'You have edits that are not yet calculated. Results and exports stay as they were until you update.'
                  : result
                    ? 'Results match these inputs.'
                    : 'Results appear once the Python service responds.'}
              </p>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-4 px-5 py-8 text-sm text-slate-700">
          <Kicker>Waiting for defaults</Kicker>
          <p className="leading-relaxed">
            {loading
              ? 'Loading the reference assumptions from the Python service…'
              : 'The reference assumptions could not be loaded, so there is nothing to edit yet.'}
          </p>
          {!loading && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-navy-900 px-4 text-sm font-medium text-white hover:bg-navy-800"
            >
              <RotateCw className="size-4" aria-hidden />
              Retry connection
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
