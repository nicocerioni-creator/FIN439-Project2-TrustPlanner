'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PaymentInput, PaymentResult, ReferenceCase } from '@/lib/api';
import referenceCase from '@/handoff/api/reference-case.json';
import paymentSchedule from '@/handoff/api/payment-schedule.example.json';
import { PlannerApp } from './planner-app';
import type { PlanSession } from './types';

type PreviewState = 'normal' | 'stale' | 'loading' | 'unavailable' | 'validation';

const STATES: { id: PreviewState; label: string }[] = [
  { id: 'normal', label: 'Calculated' },
  { id: 'stale', label: 'Edited, not updated' },
  { id: 'loading', label: 'Loading' },
  { id: 'validation', label: 'Validation error' },
  { id: 'unavailable', label: 'Service unavailable' },
];

const reference = referenceCase as unknown as ReferenceCase;
const fixture = paymentSchedule as unknown as PaymentResult;

/**
 * Renders the interface from the supplied example response. Nothing is calculated
 * and the API adapter is never called; every screen is labelled illustrative.
 */
export function IllustrativePreview() {
  const [preview, setPreview] = useState<PreviewState>('normal');
  const [input, setInput] = useState<PaymentInput>(() => structuredClone(fixture.inputs));
  const [editedFromFixture, setEditedFromFixture] = useState(false);

  const session = useMemo<PlanSession>(() => {
    const stale = preview === 'stale' || (editedFromFixture && JSON.stringify(input) !== JSON.stringify(fixture.inputs));
    const error =
      preview === 'unavailable'
        ? 'The Python service is unavailable. Check the launcher terminal and try again.'
        : preview === 'validation'
          ? 'adult_target: Illustrative validation message. The goal must not be below the minimum.'
          : '';
    return {
      mode: 'illustrative',
      reference,
      input: preview === 'stale' && !editedFromFixture ? { ...input, college_annual: '60000' } : input,
      result: preview === 'unavailable' ? null : fixture,
      stale,
      loading: preview === 'loading',
      error,
      canExport: false,
      onChange: (key, value) => {
        setEditedFromFixture(true);
        setInput(previous => ({ ...previous, [key]: value }));
      },
      onUpdate: () => undefined,
      onFamilyModeChange: () => undefined,
      onRetry: () => undefined,
      onDownload: () => undefined,
    };
  }, [preview, input, editedFromFixture]);

  const banner = (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 sm:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <p className="max-w-2xl text-sm leading-relaxed">
          <strong className="font-semibold">Illustrative design preview.</strong> Figures come from the supplied
          example response. They are not live output, nothing is calculated here, and the backend is not called.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="preview-state" className="text-xs font-semibold uppercase tracking-wider">
            Show state
          </label>
          <select
            id="preview-state"
            value={preview}
            onChange={event => setPreview(event.target.value as PreviewState)}
            className="h-10 rounded-md border border-amber-400 bg-white px-3 text-sm text-ink"
          >
            {STATES.map(state => (
              <option key={state.id} value={state.id}>
                {state.label}
              </option>
            ))}
          </select>
          <Link href="/" className="text-sm font-medium underline underline-offset-4">
            Live app
          </Link>
        </div>
      </div>
    </div>
  );

  return <PlannerApp session={session} banner={banner} />;
}
