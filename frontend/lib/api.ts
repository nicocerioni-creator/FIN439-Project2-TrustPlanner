export type PaymentInput = {
  model_start_date: string | null;
  family_mode: 'demo' | 'custom';
  starting_ages: number[];
  first_college_years: (number | null)[];
  graduation_dates: (string | null)[];
  college_annual: string;
  adult_support_enabled: boolean;
  adult_minimum: string;
  adult_target: string;
  degree_years: string[];
};

export type Beneficiary = {
  child_id: number;
  starting_age: number;
  degree_years: string;
  graduation_age: string | null;
  college_start_month: number | null;
  graduation_month: number | null;
  first_college_year: number | null;
  total_degree_semesters: number;
  past_semesters_excluded: number;
  already_graduated_at_model_start: boolean;
  college_start_date: string | null;
  graduation_date: string | null;
  adult_support_enabled: boolean;
  adult_eligibility_month: number | null;
  first_adult_payment_month: number | null;
  first_adult_payment_date: string | null;
  funded_semesters: number;
  remaining_funded_degree_years: string;
  college_obligation_model_start_dollars: string;
};

export type SemesterPayment = {
  child_id: number;
  semester: number;
  month: number | null;
  term: 'fall' | 'spring';
  academic_year: number | null;
  date: string | null;
  amount_model_start_dollars: string;
};

export type Policy = {
  cpi_indexation_basis: string;
  deflation_treatment: string;
  college_reserve_coverage: string;
  [key: string]: unknown;
};

export type PaymentResult = {
  api_version: string;
  status: 'payment_schedule_only';
  calendar_timing_complete: boolean;
  planning_horizon_months: number | null;
  inputs: PaymentInput;
  policy: Policy;
  scenario: 'college_only' | 'reference_payment_settings' | 'custom_payment_scenario';
  matches_reference_payment_amounts: boolean;
  annual_amounts_model_start_dollars: { college: string; adult_minimum: string; adult_target: string };
  college_semester_amount_model_start_dollars: string;
  college_obligation_model_start_dollars: string;
  total_funded_semesters: number;
  timeline_end_month: number;
  beneficiaries: Beneficiary[];
  college_semester_payments: SemesterPayment[];
  unresolved_policy: string[];
  model_assumptions?:string[];
  warnings: string[];
  funding_evaluation: null;
  portfolio_evaluation: null;
};

export type ReferenceCase = {
  api_version: string;
  reference_initial_capital: string;
  inputs: PaymentInput;
  policy: Policy;
  unresolved_policy: string[];
  model_assumptions?:string[];
  scope: string;
};

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'The Python service is unavailable. Check the launcher terminal and try again.';
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
      else if (Array.isArray(body.detail)) {
        message = body.detail.map((item: { loc: string[]; msg: string }) =>
          `${item.loc.filter(part => part !== 'body').join(' / ') || 'Payment plan'}: ${item.msg}`).join(' ');
      }
    } catch { /* Preserve the readable connection error for non-JSON proxy failures. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getReferenceCase(): Promise<ReferenceCase> {
  return readResponse<ReferenceCase>(await fetch('/api/v1/reference-case', { cache: 'no-store' }));
}

export async function calculatePaymentPlan(input: PaymentInput): Promise<PaymentResult> {
  return readResponse<PaymentResult>(await fetch('/api/v1/payment-schedule', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), cache: 'no-store',
  }));
}

export type ReserveRequest = {
  payment_inputs: PaymentInput;
  valuation_date: string;
  reserve_assets: string | null;
  future_cpi_annual_percent: string | null;
};
export type CPISnapshot = {
  series_id: string; index_value: string; observation_month: string;
  requested_cutoff: string; returned_vintage_date: string; reference_date: string;
  source_url: string; source_sha256: string;
};
export type ReserveResult = {
  api_version: string; status: string; valuation_date: string;
  effective_cpi_reference_date: string;
  cpi: { baseline: CPISnapshot; effective: CPISnapshot; ratio: string };
  remaining_semesters: number; remaining_obligation_model_start_dollars: string;
  required_reserve_valuation_dollars: string;
  designated_reserve_assets_valuation_dollars: string | null;
  reserve_surplus_valuation_dollars: string | null; reserve_shortfall_valuation_dollars: string | null;
  asset_comparison: 'not_entered' | 'shortfall' | 'meets_accounting_reserve';
  indexed_annual_amounts_valuation_dollars: Record<string, string>;
  future_cpi_annual_percent_assumption: string | null; scenario_nominal_college_total: string | null;
  college_payments: (SemesterPayment & { scenario_nominal_amount: string | null })[];
  scope: string;
};
export async function calculateCollegeReserve(input: ReserveRequest): Promise<ReserveResult> {
  return readResponse<ReserveResult>(await fetch('/api/v1/college-reserve', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), cache: 'no-store',
  }));
}

export type AdaptivePolicy = { enabled: boolean; real_discount_percent: string; buffer_percent: string;
  terminal_real_balance: string; max_monthly_restoration_points: string };
export type FundingRequest = {
  payment_inputs: PaymentInput;
  opening_balance: string;
  college_annual_return_percent: string;
  support_annual_return_percent: string;
  annual_cost_percent: string;
  annual_cpi_change_percent: string;
  reserve_transfer_rule: 'protect_before_payments' | 'separate_accounts';
  include_horizon_day_payments: boolean;
  portfolio_source?: PortfolioSettings | null;
  adaptive_policy?: AdaptivePolicy;
  opening_transaction_cost?: string;
  initial_college_shock_percent?: string;
  initial_support_shock_percent?: string;
};
export type FundingRow = {
  month?: string; year?: string; month_index?: number;
  period_start: string; period_end: string; opening_total: string;
  gross_growth: string; costs: string; college_due: string; college_paid: string;
  adult_due: string; adult_paid: string; adult_minimum_due: string;
  transfer_to_college: string; transfer_to_support: string;
  closing_college_assets: string; closing_support_assets: string; closing_total: string;
  closing_total_model_start_dollars: string; required_college_reserve: string;
  college_reserve_gap: string; reconciliation_difference?: string;
};
export type FundingPath = {
  path: 'minimum' | 'goal' | 'college_only' | 'adaptive';
  status: 'stopped_at_payment_shortfall' | 'completed_horizon';
  last_date: string; ending_total: string; ending_total_model_start_dollars: string;
  ending_college_assets: string; ending_support_assets: string;
  ending_required_college_reserve: string;
  first_college_reserve_gap_date: string | null;
  first_adult_minimum_breach_date: string | null;
  first_payment_shortfall: { date: string; college_unpaid: string; adult_unpaid: string; minimum_support_unpaid: string } | null;
  total_college_payments: string; total_adult_payments: string;
  total_costs: string; total_gross_growth: string; ledger_reconciles: boolean;
  monthly_ledger: FundingRow[]; annual_summary: FundingRow[];
  adaptive_reviews?: {date: string; goal_gap_share: string; minimum_liability_pv_real: string;
    minimum_budget_gap_real: string; annual_support_per_child_model_start_dollars: string}[];
};
export type FundingResult = {
  api_version: string; inputs: FundingRequest; status: 'deterministic_funding_scenarios_only';
  model_start_date: string; horizon_date: string; last_included_date: string; horizon_months: number;
  opening_allocation: { total_trust_assets: string; opening_transaction_cost?: string; net_opening_assets?: string; required_college_reserve: string; college_assets: string;
    support_assets: string; college_reserve_gap: string; total_is_college_plus_support: boolean };
  college_payments_beyond_horizon: number;
  paths: Partial<Record<FundingPath['path'], FundingPath>>;
  conventions: Record<string, string>; warnings: string[];
  portfolio_evaluation: null; mandate_compliance: null;
  calculation_inputs?: FundingRequest; investment_source?: PortfolioEstimateResult|null;
};
export async function calculateFundingProjection(input: FundingRequest): Promise<FundingResult> {
  return readResponse<FundingResult>(await fetch('/api/v1/funding-projection', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), cache: 'no-store',
  }));
}

export async function validateFundingPlan(input: unknown): Promise<{inputs: FundingRequest}> {
  return readResponse(await fetch('/api/v1/validate-funding-plan', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(input)}));
}
export type PortfolioSettings = {
  allocation_style?: 'lower_risk'|'balanced_growth'|'aggressive_growth'|'maximum_sharpe'|'target_return'|'custom';
  max_growth_fund_weight_percent?:string; proposed_weights?:Record<string,string>|null;
  decision_date:string; estimation_months:number; max_data_age_days:number; current_weights:Record<string,string>;
  initial_allocation:boolean; turnover_used_percent:string; volatility_limit_percent:string; turnover_limit_percent:string;
  max_fund_weight_percent:string; risk_off_equity_cap_percent:string; return_target_percent:string;
  transaction_cost_bps:string; pilot_max_percent:string; confirm_reserve_proxy:boolean;
  price_csv:string|null; source_available_on:string|null; confirm_uploaded_provenance:boolean;
};
export type StressSettings = {short_window_months?:number;long_window_months?:number;trade_cost_increase_bps?:string;tighter_volatility_percent?:string;tighter_fund_cap_percent?:string;enabled:boolean; support_loss_percent:string; college_loss_percent:string;
  inflation_increase_points:string; return_reduction_points:string; cost_increase_points:string; longevity_extension_years:number};
export type EvaluationRequest = {funding:FundingRequest;portfolio:PortfolioSettings;stress:StressSettings;use_historical_proxy_returns:boolean};
export type PortfolioRow = {name:string; weights:Record<string,number>; historical_arithmetic_return_percent:number;
 allocation_style?:string;allocation_label?:string;historical_sharpe_proxy?:number|null;
 historical_constant_mix_cagr_percent:number; annualized_sample_volatility_percent:number; annual_turnover_total_percent:number;
 one_way_transition_turnover_percent:number; proposed_transaction_cost:number; hard_checks:Record<string,boolean>;
 hard_checks_pass:boolean;failed_rules:string[];return_objective_met:boolean; historical_max_drawdown_percent:number;
 funding_summary?:Record<string,Partial<FundingPath>>|null;funding_note?:string;
 college_model_assets?:number|null;support_model_assets?:number|null;college_weights?:Record<string,number>;support_weights?:Record<string,number>;
 college_scenario_return_percent:number;support_scenario_return_percent:number|null};
export type EvaluationResult = {api_version:string;inputs:EvaluationRequest;status:string;
 data_card:Record<string,unknown>;portfolios:PortfolioRow[];candidate:PortfolioRow|null;funding:FundingResult|null;
 portfolio_sensitivities?:{name:string;changed_parameters:Record<string,unknown>;status:string;candidate:PortfolioRow|null;maximum_weight_change_points:number|null;reason?:string|null}[];
 candidate_funding_inputs?:FundingRequest|null;stress_tests:{name:string;status:string;reason?:string;horizon_date?:string;paths?:Record<string,Partial<FundingPath>>}[];
 recommendation:{action:string;conditions?:string[];committee_ask:string;allocation_range_percent_of_support_capital?:number[];reversal_triggers?:string[]};
 limitations?:string[];risk_definitions?:Record<string,string>;search_rule?:string;grid_combinations_examined?:number};
export async function getInvestmentData():Promise<{tickers:string[];names:Record<string,string>;manifest:Record<string,unknown>;today_eastern:string}> {
 return readResponse(await fetch('/api/v1/investment-data',{cache:'no-store'}));
}
export async function evaluatePortfolio(input:EvaluationRequest):Promise<EvaluationResult> {
 return readResponse(await fetch('/api/v1/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'}));
}
export async function validateAnalysisPlan(input:unknown):Promise<{inputs:EvaluationRequest}> {
 return readResponse(await fetch('/api/v1/validate-analysis-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}));
}

export type CollegePaymentPlan = {
 api_version:string; inputs:{payment_inputs:PaymentInput;annual_inflation_percent:string};
 model_start_date:string;annual_inflation_percent:string;total_nominal_dollars:string;
 children:{child_id:number;total_nominal_dollars:string}[];
 payment_dates:{date:string;total_nominal_dollars:string;payments:{child_id:number;semester:number;term:string;amount_nominal_dollars:string}[]}[];
 convention:string;
};
export async function calculateCollegePaymentPlan(payment_inputs:PaymentInput,annual_inflation_percent:string):Promise<CollegePaymentPlan> {
 return readResponse(await fetch('/api/v1/college-payment-plan',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({payment_inputs,annual_inflation_percent}),cache:'no-store'}));
}

export type InvestmentContext = Pick<FundingRequest,'payment_inputs'|'opening_balance'|'opening_transaction_cost'>;
export type PortfolioEstimateResult = {api_version:string;inputs:InvestmentContext&{portfolio:PortfolioSettings};
 status:string;data_card:Record<string,unknown>;portfolios:PortfolioRow[];candidate:PortfolioRow|null;search_rule?:string};
export type PortfolioSelection = {contextKey:string;settings:PortfolioSettings;estimate:PortfolioEstimateResult};
export async function estimatePortfolio(input:InvestmentContext&{portfolio:PortfolioSettings}):Promise<PortfolioEstimateResult> {
 return readResponse(await fetch('/api/v1/portfolio-estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'}));
}

export type PortfolioCasesResult={api_version:string;cases:Partial<Record<string,PortfolioEstimateResult>>;data_card:Record<string,unknown>};
export async function getPortfolioCases(input:InvestmentContext&{portfolio:PortfolioSettings}):Promise<PortfolioCasesResult> {
 return readResponse(await fetch('/api/v1/portfolio-cases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'}));
}

export type GrowthPoint = {year:number;p10:number;median:number;p90:number;mean:number};
export type SimulationResult = {points:GrowthPoint[];paths:number;years:number;seed:number;starting_index:number;
 terminal_loss_frequency_percent:number;method:string;limitations:string[];weights:Record<string,number>;allocation_label:string};
export type SimulationRequest=InvestmentContext&{portfolio:PortfolioSettings;years:number;paths:number;seed:number;scope:'long_term'|'whole_trust';annual_cost_percent:string};
export async function simulatePortfolio(input:SimulationRequest):Promise<SimulationResult> {
 return readResponse(await fetch('/api/v1/portfolio-simulation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'}));
}
