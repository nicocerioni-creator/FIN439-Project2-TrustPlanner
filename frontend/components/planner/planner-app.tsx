'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Badge, Kicker } from './primitives';
import { AppShell, VIEW_META } from './app-shell';
import type { FundingRequest, InvestmentContext, PortfolioSelection, EvaluationRequest } from '@/lib/api';
import { FundingView } from './funding-view';
import { EvidenceView } from './evidence-view';
import { PlanView } from './plan-view';
import { PortfolioView } from './portfolio-view';
import { ReserveView } from './reserve-view';
import { ScopeNote, StatusBanners } from './status-banners';
import type { PlanSession, View, FundingRecord, PortfolioRecord, CollegeRecord } from './types';

const HEADINGS: Record<View, { title: string; blurb: string }> = {
  plan: {
    title: 'Family & payments',
    blurb: 'College comes first, then adult support. Set the assumptions and see when each child is paid.',
  },
  reserve: {
    title: 'College overview',
    blurb: 'Remaining college allowances by child, with an inflation-adjusted payment calendar.',
  },
  funding: { title: 'Funding & cash flows', blurb: 'Connect your assets and investments to college payments and affordable long-term family support.' },
  portfolio: {
    title: 'Portfolio & stress',
    blurb: 'Compare constrained allocations, point-in-time data admission and adverse funding scenarios.',
  },
  evidence: {
    title: 'Evidence & exports',
    blurb: 'Current results, the trust mandate and downloads to save, reopen or share your analysis.',
  },
};

const SCENARIO: Record<string, { tone: 'teal' | 'amber'; label: string }> = {
  reference_payment_settings: { tone: 'teal', label: 'Reference payment settings' },
  college_only: { tone: 'amber', label: 'Alternative scenario: college only' },
  custom_payment_scenario: { tone: 'amber', label: 'Alternative scenario: custom payment settings' },
};

export function PlannerApp({ session, banner }: { session: PlanSession; banner?: ReactNode }) {
  const [investmentContext,setInvestmentContext]=useState<InvestmentContext|null>(null);
  const [portfolioSelection,setPortfolioSelection]=useState<PortfolioSelection|null>(null);
  const [fundingRequest,setFundingRequest]=useState<FundingRequest|null>(null);
  const [appliedFunding,setAppliedFunding]=useState<FundingRequest|null>(null);
  const [inflationValue,setInflationValue]=useState('');
  const [fundingRecord,setFundingRecord]=useState<FundingRecord|null>(null);
  const [portfolioRecord,setPortfolioRecord]=useState<PortfolioRecord|null>(null);
  const [collegeRecord,setCollegeRecord]=useState<CollegeRecord|null>(null);
  const [importAnalysis,setImportAnalysis]=useState<EvaluationRequest|null>(null);
  const restoreAnalysis=useCallback((value:EvaluationRequest)=>{setFundingRecord(null);setPortfolioRecord(null);setCollegeRecord(null);setAppliedFunding(value.funding);setImportAnalysis(value);setInflationValue(value.funding.annual_cpi_change_percent);},[]);
  const [view, setView] = useState<View>('plan');
  const [menuOpen, setMenuOpen] = useState(false);
  const { error, result } = session;

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view]);

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);

  const reviewAssumptions = useCallback(() => {
    setView('plan');
    window.setTimeout(() => {
      const panel = document.getElementById('assumptions');
      panel?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      panel?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({ preventScroll: true });
    }, 60);
  }, []);

  const heading = HEADINGS[view];
  const scenario = result ? SCENARIO[result.scenario] : null;

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      menuOpen={menuOpen}
      onMenuChange={setMenuOpen}
      session={session}
      banner={banner}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl">
          <Kicker>{VIEW_META[view].short}</Kicker>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] text-navy-900 sm:text-5xl">{heading.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{heading.blurb}</p>
        </div>
        {scenario && view !== 'portfolio' && <Badge tone={scenario.tone}>{scenario.label}</Badge>}
      </div>

      <div className="mb-8 space-y-3">
        {(view === 'funding' || view === 'portfolio' || view === 'reserve') ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Research scenarios and historical risk estimates. Checks apply to the entered assumptions; future risk limits and lifelong solvency are not guaranteed.</p> : view==='plan'?<ScopeNote />:null}
        <StatusBanners session={session} onReviewAssumptions={reviewAssumptions} />
      </div>

      {view === 'plan' && <PlanView session={session} />}
      <div hidden={view !== 'reserve'}><ReserveView session={session} onEvidenceChange={setCollegeRecord} inflation={{value:inflationValue,onChange:setInflationValue}} onOpenFunding={()=>setView('funding')} /></div>
      <div hidden={view !== 'funding'}><FundingView session={session} onEvidenceChange={setFundingRecord} onRequestChange={setFundingRequest} importRequest={appliedFunding} inflation={{value:inflationValue,onChange:setInflationValue}} onOpenCollege={()=>setView('reserve')} onOpenPortfolio={()=>setView('portfolio')} onContextChange={setInvestmentContext} selection={portfolioSelection} onSelectPortfolio={setPortfolioSelection} /></div>
      <div hidden={view !== 'portfolio'}><PortfolioView session={session} onEvidenceChange={setPortfolioRecord} importAnalysis={importAnalysis} funding={fundingRequest} context={investmentContext} onSelectPortfolio={setPortfolioSelection} onApplyFunding={setAppliedFunding} onOpenFunding={()=>setView('funding')} /></div>
      <div hidden={view !== 'evidence'}><EvidenceView session={session} funding={fundingRecord} portfolio={portfolioRecord} college={collegeRecord} annualInflation={inflationValue} onRestore={restoreAnalysis} onOpenFunding={()=>setView('funding')} onOpenPortfolio={()=>setView('portfolio')} onOpenCollege={()=>setView('reserve')} /></div>
    </AppShell>
  );
}
