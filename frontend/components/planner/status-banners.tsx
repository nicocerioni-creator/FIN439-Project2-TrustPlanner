import { CircleAlert, Info, LoaderCircle, RefreshCw, ServerOff } from 'lucide-react';
import type { PlanSession } from './types';

export function isServiceUnavailable(message: string): boolean {
  return /^The Python service is unavailable|failed to fetch|networkerror|load failed|could not connect/i.test(message);
}

export function ScopeNote() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <Info className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
      <p>
        <strong className="font-semibold text-navy-900">Family payment schedule.</strong> Review Funding &amp; cash flows for affordability and Portfolio &amp; stress for allocation checks.
      </p>
    </div>
  );
}

export function StatusBanners({
  session,
  onReviewAssumptions,
}: {
  session: PlanSession;
  onReviewAssumptions: () => void;
}) {
  const { error, stale, loading, result, onRetry, onUpdate } = session;
  const unavailable = error ? isServiceUnavailable(error) : false;

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950">
          {unavailable ? (
            <ServerOff className="mt-0.5 size-5 shrink-0 text-rose-700" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-700" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {unavailable ? 'The Python service could not be reached' : 'The Python service could not accept these inputs'}
            </p>
            <p className="mt-1 break-words leading-relaxed">{error}</p>
            <p className="mt-2 leading-relaxed text-rose-900/80">
              {unavailable
                ? 'Your entries are kept. Check that the FastAPI service is running, then try again. No result is shown or exported for inputs the service has not calculated.'
                : 'Adjust the highlighted assumption and update the plan again.'}
              {result && stale ? ' The results below are from earlier inputs and exports are disabled.' : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {!unavailable && (
                <button
                  type="button"
                  onClick={onReviewAssumptions}
                  className="min-h-10 rounded-md bg-rose-900 px-4 text-sm font-medium text-white hover:bg-rose-950"
                >
                  Review assumptions
                </button>
              )}
              <button
                type="button"
                onClick={onRetry}
                disabled={loading}
                className="min-h-10 rounded-md border border-rose-300 bg-white px-4 text-sm font-medium text-rose-900 hover:bg-rose-100 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {stale && !error && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <RefreshCw className="size-4 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">
            <strong className="font-semibold">Assumptions changed.</strong> The results below belong to the
            previous inputs. Update the payment plan to refresh them; exports stay disabled until then.
          </p>
          <button
            type="button"
            onClick={onUpdate}
            disabled={loading}
            className="min-h-10 rounded-md bg-amber-900 px-4 text-sm font-medium text-white hover:bg-amber-950 disabled:opacity-50"
          >
            Update payment plan
          </button>
        </div>
      )}

      {loading && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-teal-700 motion-reduce:animate-none" aria-hidden />
          Calculating the payment schedule in Python…
        </div>
      )}
    </div>
  );
}
