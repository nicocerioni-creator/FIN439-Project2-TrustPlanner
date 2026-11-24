import Link from 'next/link';
import { CalendarDays, Palette } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { AssumptionsForm } from './assumptions-form';
import { BeneficiaryTable } from './beneficiary-table';
import { FamilyTimeline } from './family-timeline';
import { Sheet, SheetSection } from './primitives';
import { SummaryLedger } from './summary-ledger';
import type { PlanSession } from './types';

function PaymentRules() {
  const rules = [
    ['College comes first', 'Fall payments land on August 1 and spring payments on January 1, each for half the annual allowance, through graduation. Entry defaults to the first fall on or after age 18.'],
    ['Adult support follows', 'Eligibility begins at graduation. The first monthly payment is one month later, then monthly. Turning it off removes every adult payment.'],
    ['Purchasing power is protected', 'All active amounts are linked to CPI from model start, even before the first benefit is received, and fall proportionately if CPI falls.'],
    ['Inflation assumptions', 'Monthly CPI-U updates use released observations available at the update date. No future inflation path or funding result has been assumed.'],
  ];
  return (
    <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      {rules.map(([term, detail]) => (
        <div key={term} className="border-l-2 border-teal-600/40 pl-4">
          <dt className="text-sm font-semibold text-navy-900">{term}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-slate-600">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PlanView({ session }: { session: PlanSession }) {
  const { result, stale, loading, error, mode } = session;
  const startDate = result?.inputs.model_start_date;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
      <Sheet>
        {result ? (
          <>
            <SummaryLedger result={result} stale={stale} variant="plan" />
            <SheetSection
              id="timeline"
              kicker="The big picture"
              title={`${result.beneficiaries.length} ${result.beneficiaries.length === 1 ? 'child' : 'children'}, one family plan`}
              aside={
                <p className="flex items-center gap-2 text-xs text-slate-600">
                  <CalendarDays className="size-4 text-teal-700" aria-hidden />
                  {startDate
                    ? `Model starts ${formatDate(startDate)}`
                    : 'Choose a model start date for calendar timing'}
                </p>
              }
            >
              <FamilyTimeline result={result} stale={stale} />
            </SheetSection>
            <SheetSection id="beneficiaries" kicker="Timing from the Python service" title="When support begins">
              <div className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                <BeneficiaryTable beneficiaries={result.beneficiaries} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                Ages are assumed exact at model start. Calendar dates appear only if you choose a model start date.
              </p>
            </SheetSection>
            <SheetSection id="rules" kicker="Payment rules" title="How the schedule works">
              <PaymentRules />
            </SheetSection>
          </>
        ) : (
          <section className="px-5 py-14 sm:px-8" aria-live="polite">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {loading ? 'Calculating' : 'No schedule to show'}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">
              {loading ? 'Waiting for the Python service' : 'The family timeline needs the Python service'}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              {loading
                ? 'The reference assumptions are being fetched and the first payment schedule is being calculated.'
                : error
                  ? 'Nothing is shown in place of a real result. Start the FastAPI service and retry; no sample data is substituted.'
                  : 'Results will appear here.'}
            </p>
            {mode === 'live' && !loading && (
              <p className="mt-6 flex items-center gap-2 text-sm text-slate-700">
                <Palette className="size-4 text-teal-700" aria-hidden />
                Reviewing the design without the backend?
                <Link href="/design-preview" className="font-medium text-teal-800 underline underline-offset-4 hover:text-teal-900">
                  Open the illustrative design preview
                </Link>
              </p>
            )}
          </section>
        )}
      </Sheet>
      <AssumptionsForm session={session} />
    </div>
  );
}
