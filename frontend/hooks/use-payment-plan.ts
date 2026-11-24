'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculatePaymentPlan,
  getReferenceCase,
  type PaymentInput,
  type PaymentResult,
  type ReferenceCase,
} from '@/lib/api';
import type { PlanSession } from '@/components/planner/types';

/**
 * Live state for the planner. All results come from lib/api.ts. A failed request
 * never substitutes a fixture or a previous success for the new inputs.
 */
export function usePaymentPlan(): PlanSession {
  const [reference, setReference] = useState<ReferenceCase | null>(null);
  const [input, setInput] = useState<PaymentInput | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [submitted, setSubmitted] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const customDraft = useRef<PaymentInput | null>(null);
  const latestInput = useRef(input);
  latestInput.current = input;

  const stale = !!result && JSON.stringify(input) !== submitted;

  const initialize = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const defaults = await getReferenceCase();
      if (id !== requestId.current) return;
      setReference(defaults);
      setInput(defaults.inputs);
      const plan = await calculatePaymentPlan(defaults.inputs);
      if (id !== requestId.current) return;
      setResult(plan);
      setSubmitted(JSON.stringify(defaults.inputs));
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : 'Could not connect to the Python service.');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initialize();
    return () => {
      requestId.current++;
    };
  }, [initialize]);

  const onUpdate = useCallback(async () => {
    if (!input) throw new Error('Enter a family plan before updating payments.');
    const id = ++requestId.current;
    const snapshot = structuredClone(input);
    setLoading(true);
    setError('');
    try {
      const plan = await calculatePaymentPlan(snapshot);
      if (id !== requestId.current) throw new Error('Payment update was superseded by another request.');
      if (JSON.stringify(latestInput.current) !== JSON.stringify(snapshot)) {
        throw new Error('Family inputs changed during the update. Press Update college payments again to use the latest edits.');
      }
      setInput(plan.inputs);
      setResult(plan);
      setSubmitted(JSON.stringify(plan.inputs));
      return plan;
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : 'Payment plan could not be updated.');
      }
      throw err;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [input]);

  const onChange = useCallback(
    <K extends keyof PaymentInput>(key: K, value: PaymentInput[K]) => {
      setInput(previous => (previous ? { ...previous, [key]: value } : previous));
    },
    [],
  );

  const onRetry = useCallback(() => {
    void (input ? onUpdate().catch(() => {}) : initialize());
  }, [input, onUpdate, initialize]);

  const onFamilyModeChange = useCallback((familyMode: PaymentInput['family_mode']) => {
    if (!reference) return;
    setInput(previous => {
      if (!previous || previous.family_mode === familyMode) return previous;
      if (familyMode === 'demo') {
        customDraft.current = structuredClone(previous);
        return { ...structuredClone(reference.inputs), model_start_date: previous.model_start_date };
      }
      return customDraft.current ? structuredClone(customDraft.current)
        : { ...structuredClone(previous), family_mode: 'custom' };
    });
  }, [reference]);

  const onImportPaymentPlan = useCallback(async (saved: PaymentInput) => {
    const id=++requestId.current;
    setLoading(true);setError('');
    try {
      const plan=await calculatePaymentPlan(saved);
      if (id!==requestId.current) throw new Error('Import was superseded by another request.');
      setInput(plan.inputs);setResult(plan);setSubmitted(JSON.stringify(plan.inputs));
      if (plan.inputs.family_mode==='custom') customDraft.current=structuredClone(plan.inputs);
    } catch(err) {
      if(id===requestId.current)setError(err instanceof Error?err.message:'Could not import this plan.');
      throw err;
    } finally {if(id===requestId.current)setLoading(false);}
  }, []);

  const canExport = !!result && !stale && !loading && !error;

  const onDownload = useCallback(() => {
    if (!result || !canExport) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payment_assumptions.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [result, canExport]);

  return {
    mode: 'live',
    reference,
    input,
    result,
    stale,
    loading,
    error,
    canExport,
    onChange,
    onFamilyModeChange,
    onUpdate: () => void onUpdate().catch(() => {}),
    onRefreshPaymentPlan: onUpdate,
    onRetry,
    onDownload,
    onImportPaymentPlan,
  };
}
