import type { PaymentResult } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Kicker } from './primitives';

export function SummaryLedger({
  result,
  stale,
  variant,
}: {
  result: PaymentResult;
  stale: boolean;
  variant: 'plan' | 'reserve';
}) {
  const adultOn = result.inputs.adult_support_enabled;
  return (
    <section
      aria-label="Calculated payment plan summary"
      className={`px-5 py-7 transition-opacity sm:px-8 sm:py-9 ${stale ? 'opacity-60' : ''}`}
    >
      <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Kicker>{variant === 'reserve' ? 'Full college obligation' : 'Scheduled college payments'}</Kicker>
          <p
            data-testid="college-obligation"
            className="mt-2 font-serif text-5xl leading-none tabular-nums text-navy-900 sm:text-7xl"
          >
            {formatMoney(result.college_obligation_model_start_dollars)}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            All remaining college payments through graduation, in model-start purchasing power.
          </p>
        </div>
        <div className="border-t border-slate-200 pt-6">
          <Kicker>Funded semesters</Kicker>
          <p className="mt-2 font-serif text-4xl tabular-nums text-navy-900">{result.total_funded_semesters}</p>
          <p className="mt-2 text-sm text-slate-600">
            Each receives {formatMoney(result.college_semester_amount_model_start_dollars)}: August 1 for fall, January 1 for spring.
          </p>
        </div>
        <div className="border-t border-slate-200 pt-6">
          <Kicker>Adult support</Kicker>
          <p className="mt-2 font-serif text-4xl text-navy-900">{adultOn ? 'On' : 'Off'}</p>
          <p className="mt-2 text-sm text-slate-600">
            {adultOn
              ? 'Monthly, starting one month after each graduation.'
              : 'No adult payments are scheduled. College only.'}
          </p>
        </div>
      </div>
      <p className="mt-7 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-600">
        This is the total of scheduled allowances in model-start dollars. It is not a present-value estimate of
        the assets required today, and it is not a claim that the trust is fully funded.
        {stale && <strong className="ml-1 font-semibold text-amber-800">Out of date: update the plan to refresh.</strong>}
      </p>
    </section>
  );
}
