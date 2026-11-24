'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { FileCheck2, Layers, Menu, ShieldCheck, SlidersHorizontal, Users, X } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { isServiceUnavailable } from './status-banners';
import type { PlanSession, View } from './types';

export const VIEW_META: Record<View, { label: string; short: string; icon: typeof Users }> = {
  plan: { label: 'Family & payments', short: 'Family & payments', icon: Users },
  reserve: { label: 'College overview', short: 'College overview', icon: ShieldCheck },
  funding: { label: 'Funding & cash flows', short: 'Funding & cash flows', icon: Layers },
  portfolio: { label: 'Portfolio & stress', short: 'Portfolio & stress', icon: SlidersHorizontal },
  evidence: { label: 'Evidence & exports', short: 'Evidence & exports', icon: FileCheck2 },
};
const ORDER: View[] = ['plan', 'reserve', 'funding', 'portfolio', 'evidence'];

function BrandMark() {
  return (
    <span className="grid size-10 place-items-center rounded-lg bg-teal-500/15 ring-1 ring-teal-400/40" aria-hidden>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <g className="text-teal-300">
          <path d="M5 19V13" />
          <path d="M10 19V9" />
          <path d="M15 19V5" />
          <path d="M20 19V11" opacity=".55" />
          <path d="M3 19.5h19" />
        </g>
      </svg>
    </span>
  );
}

function Navigation({
  view,
  onSelect,
}: {
  view: View;
  onSelect: (view: View) => void;
}) {
  return (
    <nav aria-label="Main navigation" className="mt-8">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
      <ul className="mt-3 space-y-1">
        {ORDER.map((id, index) => {
          const active = id === view;
          const Icon = VIEW_META[id].icon;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(id)}
                className={`group relative flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition-colors ${
                  active
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${active ? 'bg-teal-400' : 'bg-transparent'}`}
                />
                <span className="w-5 text-xs tabular-nums text-teal-300/80" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon className="size-[18px] shrink-0 opacity-80" strokeWidth={1.6} aria-hidden />
                <span className="flex-1">{VIEW_META[id].label}</span>
                {id === 'portfolio' && (
                  <span className="rounded border border-slate-500/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                    Research
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ReferenceContext({ session }: { session: PlanSession }) {
  const ages = session.input?.starting_ages ?? [];
  const isDemo = session.input?.family_mode === 'demo';
  return (
    <div className="mt-auto border-t border-white/10 pt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{isDemo ? 'Demo trust context' : 'Your family'}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums text-white">
        {isDemo && session.reference ? formatMoney(session.reference.reference_initial_capital) : `${ages.length} ${ages.length === 1 ? 'child' : 'children'}`}
      </p>
      <p className="mt-1 text-sm text-slate-300">
        {isDemo ? 'Four demo beneficiaries' : 'Starting ages'}
        {ages.length ? ` · ${ages.map(age => Number.isFinite(age) ? age : '—').join(' · ')}` : ' · Add a child to begin'}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        {isDemo ? 'The demo opening balance is used in Funding & cash flows after you enter explicit scenario assumptions.' : 'Enter your opening balance and scenario assumptions in Funding & cash flows.'}
      </p>
    </div>
  );
}

export function AppShell({
  view,
  onViewChange,
  menuOpen,
  onMenuChange,
  session,
  banner,
  children,
}: {
  view: View;
  onViewChange: (view: View) => void;
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
  session: PlanSession;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMenuChange(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen, onMenuChange]);

  const connection =
    session.mode === 'illustrative'
      ? { label: 'Illustrative data', dot: 'bg-amber-500' }
      : session.error && isServiceUnavailable(session.error)
        ? { label: 'Python service not reachable', dot: 'bg-rose-500' }
        : session.result
          ? { label: 'Python service connected', dot: 'bg-teal-500' }
          : { label: 'Connecting…', dot: 'bg-slate-400' };

  return (
    <div className="min-h-dvh lg:pl-72">
      <a
        href="#main"
        className="fixed left-4 top-[-80px] z-[100] rounded-md bg-white px-4 py-3 text-sm font-medium text-navy-900 shadow focus:top-4"
      >
        Skip to content
      </a>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          className="fixed inset-0 z-40 bg-navy-950/60 lg:hidden"
          onClick={() => onMenuChange(false)}
        />
      )}

      <aside
        id="main-sidebar"
        aria-label="Workspace sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-navy-950 px-5 py-6 text-slate-200 transition-[transform,visibility] duration-200 motion-reduce:transition-none lg:visible lg:translate-x-0 ${
          menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="leading-tight">
              <p className="font-serif text-xl text-white">Trust support</p>
              <p className="font-serif text-xl italic text-teal-300">planner</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onMenuChange(false)}
            aria-label="Close navigation"
            className="grid size-11 place-items-center rounded-md text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <Navigation
          view={view}
          onSelect={id => {
            onViewChange(id);
            onMenuChange(false);
          }}
        />
        <ReferenceContext session={session} />
      </aside>

      <div className="flex min-h-dvh flex-col">
        {banner}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8 lg:h-16">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => onMenuChange(true)}
              aria-label="Open navigation"
              aria-controls="main-sidebar"
              aria-expanded={menuOpen}
              className="-ml-2 grid size-11 place-items-center rounded-md text-navy-900 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <Layers className="hidden size-4 text-slate-400 lg:block" aria-hidden />
            <span className="hidden text-slate-500 sm:inline">Trust support planner</span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden>
              /
            </span>
            <strong className="truncate font-medium text-navy-900">{VIEW_META[view].label}</strong>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
            <span className={`size-2 rounded-full ${connection.dot}`} aria-hidden />
            {connection.label}
          </span>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-6 text-xs leading-relaxed text-slate-600 md:grid-cols-2">
            <p>
              <strong className="font-semibold text-navy-900">Educational and research use only.</strong> Not
              investment advice. Nothing here guarantees future results or confirms that any trust is
              adequately funded.
            </p>
            <p>
              OpenAI Codex assisted with the existing code and tests; v0 contributes the new interface design.
              The analysis and decisions are the student&apos;s own.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
