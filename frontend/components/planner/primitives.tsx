import type { ReactNode } from 'react';

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">{children}</p>
  );
}

/** A white "sheet" of hairline-separated sections, used instead of a grid of cards. */
export function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SheetSection({
  id,
  kicker,
  title,
  aside,
  children,
}: {
  id?: string;
  kicker?: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="px-5 py-7 sm:px-8 sm:py-9" aria-labelledby={id ? `${id}-title` : undefined}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          {kicker && <Kicker>{kicker}</Kicker>}
          <h2
            id={id ? `${id}-title` : undefined}
            className="mt-1 font-serif text-2xl leading-tight text-navy-900 sm:text-[28px]"
          >
            {title}
          </h2>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

type Tone = 'neutral' | 'teal' | 'amber' | 'navy';
const toneClass: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  teal: 'bg-teal-50 text-teal-800 ring-teal-200',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  navy: 'bg-navy-900 text-white ring-navy-900',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-thin -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">{children}</div>
  );
}

export const tableHead =
  'whitespace-nowrap border-b border-slate-300 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600';
export const tableCell = 'border-b border-slate-100 px-4 py-3.5 align-top text-sm text-slate-800';
