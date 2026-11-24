import { formatDuration, formatYears } from '@/lib/format';
import type { PaymentResult } from '@/lib/api';

/**
 * Lays out backend-supplied month offsets on a shared axis. Positions are
 * proportions of timeline_end_month; no amounts or eligibility are derived here.
 */
export function FamilyTimeline({ result, stale }: { result: PaymentResult; stale: boolean }) {
  if (!result.calendar_timing_complete || result.beneficiaries.length === 0) {
    return <div className="space-y-3 text-sm leading-relaxed text-slate-600">
      <p>{result.beneficiaries.length ? 'Choose a model start date to align the timeline with August 1 and January 1 payments and semester-end graduation dates.' : 'Add a child in Your family to create a timeline.'}</p>
      <ul className="space-y-2">{result.beneficiaries.map(child => <li key={child.child_id}>Child {child.child_id} · age {child.starting_age} · {child.funded_semesters} remaining college semesters</li>)}</ul>
    </div>;
  }
  const end = result.timeline_end_month;
  const place = (month: number) => `${(month / end) * 100}%`;
  const ticks: number[] = [];
  for (let year = 0; year * 12 <= end; year += 5) ticks.push(year);
  const anyAdult = result.beneficiaries.some(child => child.adult_support_enabled);

  return (
    <figure className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <figcaption className="sr-only">
        College and graduation timeline for the selected family, measured in years from model start.
      </figcaption>

      <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-[8.5rem_1fr]">
        <div aria-hidden className="hidden sm:block" />
        <div aria-hidden className="relative mb-2 mr-4 h-5 text-xs tabular-nums text-slate-500">
          {ticks.map(year => (
            <span
              key={year}
              className="absolute -translate-x-1/2 first:translate-x-0"
              style={{ left: place(year * 12) }}
            >
              {year === 0 ? 'Start' : `${year} yr`}
            </span>
          ))}
        </div>

        {result.beneficiaries.map(child => {
          const startMonth = child.college_start_month ?? 0;
          const graduationMonth = child.graduation_month ?? 0;
          const adultStart = child.first_adult_payment_month ?? child.adult_eligibility_month;
          const label = `Child ${child.child_id}: college starts ${formatDuration(startMonth)} from start, graduation ${formatDuration(graduationMonth)} from start${
            child.adult_support_enabled && child.first_adult_payment_month !== null
              ? `, adult payments begin ${formatDuration(child.first_adult_payment_month)} from start`
              : ', no adult payments'
          }`;
          return (
            <div key={child.child_id} className="contents">
              <div className="flex items-baseline justify-between pb-1 pt-4 sm:block sm:pb-0 sm:pt-0 sm:self-center">
                <p className="text-sm font-semibold text-navy-900">Child {child.child_id}</p>
                <p className="text-xs text-slate-500">Age {child.starting_age} at start</p>
              </div>
              <div role="img" aria-label={label} className="relative mr-4 h-12 border-b border-slate-100">
                {ticks.map(year => (
                  <span
                    key={year}
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-slate-100"
                    style={{ left: place(year * 12) }}
                  />
                ))}
                <span aria-hidden className="absolute left-0 top-1/2 h-px bg-slate-300" style={{ width: place(Math.max(0, startMonth)) }} />
                <span
                  aria-hidden
                  className="absolute top-1/2 flex h-7 -translate-y-1/2 items-center justify-center overflow-hidden rounded-[5px] bg-teal-700 text-[11px] font-medium text-white"
                  style={{
                    left: place(Math.max(0, startMonth)),
                    width: `${((Math.max(0, graduationMonth) - Math.max(0, startMonth)) / end) * 100}%`,
                  }}
                >
                  {formatYears(child.degree_years)}
                </span>
                {child.adult_support_enabled && adultStart !== null && (
                  <span
                    aria-hidden
                    className="bg-adult-support absolute top-1/2 h-7 -translate-y-1/2 rounded-r-[5px] border border-dashed border-teal-600/60"
                    style={{ left: place(Math.max(0, adultStart)), right: 0 }}
                  />
                )}
                <span
                  aria-hidden
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-navy-900"
                  style={{ left: place(Math.max(0, graduationMonth)) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 sm:pl-[9.75rem]">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-5 rounded-sm bg-teal-700" />
          College funding (degree length)
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rotate-45 bg-navy-900" />
          Graduation{anyAdult ? ' and adult eligibility' : ''}
        </li>
        {anyAdult ? (
          <li className="flex items-center gap-2">
            <span aria-hidden className="bg-adult-support h-3 w-5 rounded-sm border border-dashed border-teal-600/60" />
            Adult support after graduation (funding not evaluated)
          </li>
        ) : (
          <li className="font-medium text-slate-800">Adult support is off: no adult payments are scheduled.</li>
        )}
      </ul>
      <p className="mt-3 text-xs text-slate-500">The timeline focuses on college and the start of adult payments, not the full funding horizon. A marker at model start may represent graduation before model start; see exact dates in the table.</p>
    </figure>
  );
}
