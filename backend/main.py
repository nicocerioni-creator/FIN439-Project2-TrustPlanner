"""Validated trust planning, historical investment estimates and conditional cash flows."""
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.cpi_data import CPIDataError, eastern_today
from backend.college_reserve import reserve_valuation
from backend.funding_projection import project_funding
from pydantic import BaseModel, ConfigDict, Field, model_validator

from payment_policy import BASE_ANNUAL_AMOUNTS, STARTING_AGES, annual_payment_amounts
from academic_calendar import academic_timing

Money = Annotated[Decimal, Field(ge=0, max_digits=16, decimal_places=2, allow_inf_nan=False)]
Degree = Annotated[Decimal, Field(gt=0, le=100, multiple_of=Decimal('0.5'), allow_inf_nan=False)]
Age = Annotated[int, Field(ge=0, le=100, strict=True)]
API_VERSION = '4.4.0'


class PaymentRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    model_start_date: date | None = None
    family_mode: Literal['demo', 'custom'] = 'custom'
    starting_ages: Annotated[list[Age], Field(max_length=50)] = list(STARTING_AGES)
    first_college_years: list[Annotated[int, Field(ge=1900, le=2300)] | None] | None = None
    graduation_dates: list[date | None] | None = None
    college_annual: Money = Decimal(50_000)
    adult_support_enabled: bool = True
    adult_minimum: Money = Decimal(20_000)
    adult_target: Money = Decimal(200_000)
    degree_years: Annotated[list[Degree], Field(max_length=50)] = [Decimal(4)] * 4

    @model_validator(mode='after')
    def validate_payment_rules(self):
        annual_payment_amounts(self.college_annual, self.adult_support_enabled,
                               self.adult_minimum, self.adult_target)
        if self.model_start_date and not 1900 <= self.model_start_date.year <= 2100:
            raise ValueError('Model start date must be between 1900 and 2100, as in the original app.')
        if len(self.starting_ages) != len(self.degree_years):
            raise ValueError('Each child needs one starting age and one degree length.')
        for field in ('first_college_years', 'graduation_dates'):
            values = getattr(self, field)
            if values is None:
                setattr(self, field, [None] * len(self.starting_ages))
            elif len(values) != len(self.starting_ages):
                raise ValueError(f'{field} must have one entry per child.')
        if self.family_mode == 'demo' and (
            tuple(self.starting_ages) != STARTING_AGES or
            any(degree != 4 for degree in self.degree_years) or
            not self.adult_support_enabled or self.college_annual != 50_000 or
            self.adult_minimum != 20_000 or self.adult_target != 200_000 or
            any(self.first_college_years) or any(self.graduation_dates)
        ):
            raise ValueError('The demo uses four children aged 8, 6, 4 and 2 with the reference payment settings. Switch to custom family to edit them.')
        return self


POLICY = {
    'starting_ages': list(STARTING_AGES),
    'starting_ages_assumed_exact': True,
    'college_entry_age': 18,
    'college_entry_rule': 'first_august_1_on_or_after_age_18_unless_overridden',
    'college_allowance_type': 'fixed_annual_allowance',
    'cpi_indexation_basis': 'model_start',
    'deflation_treatment': 'benefits_fall_proportionately_with_cpi',
    'college_funding_end': 'graduation',
    'college_reserve_coverage': 'all_remaining_college_payments_through_graduation',
    'one_semester_annual_fraction': '0.5',
    'college_payment_timing': 'fall_august_1_spring_january_1',
    'estimated_graduation_rule': 'may_31_after_spring_or_december_31_after_fall_editable',
    'cpi_series': 'CPI-U, U.S. city average, all items, not seasonally adjusted',
    'cpi_update_frequency': 'monthly',
    'cpi_availability_rule': 'latest_observation_in_vintage_before_reference_date',
    'cpi_update_day': 'first_day_of_month_before_payments',
    'cpi_baseline_cutoff': 'prior_day_before_model_start',
    'college_reserve_valuation': 'full_undiscounted_remaining_allowance_cpi_adjusted',
    'data_cost_policy': 'free_public_data_no_api_keys_no_paid_fallback',
    'adult_support_review_frequency': 'monthly',
    'planning_horizon_youngest_age': 80,
    'include_youngest_80th_birthday_payments': True,
    'adult_eligibility': 'graduation',
    'adult_first_payment': 'one_month_after_graduation',
    'adult_payment_frequency': 'monthly',
}

# User adopted these modelling conventions after reviewing Evidence recommendations.
# Limitations remain explicit; they are not unresolved user choices.
UNRESOLVED = []  # Compatibility field for older clients.
MODEL_ASSUMPTIONS = [
    'Future CPI and investment returns are scenario assumptions, not known future observations.',
    'SGOV is the classroom reserve proxy; CPI liability matching and real-world liquidation timing are not guaranteed.',
    'Advanced support-budget settings are explicit scenario assumptions, not empirically optimal calibrations.',
    'Long-only seven-fund scope; historical sample covariance and proposed one-way turnover are decision checks. Future rebalancing and monitoring are not simulated.',
    'Reject proposed allocations failing hard checks; a backing gap or missed hard minimum is a failure, not authorization to waive obligations.',
]
POLICY.update({
    'investment_scope':'long_only_seven_fund_research_universe',
    'college_backing_proxy':'SGOV',
    'historical_risk_measure':'monthly_sample_covariance_annualized_by_12',
    'turnover_measure':'one_way_transition_plus_entered_annual_usage',
    'hard_check_failure_response':'reject_proposed_allocation_and_review',
    'support_budget_baseline':'0_real_discount_0_cushion_0_terminal_balance_100_restoration_points_editable',
    'future_monitoring':'not_simulated_no_future_limit_guarantee',
})


app = FastAPI(title='Trust support planner API', version=API_VERSION,
              description='Educational research: payments, reserve accounting, draft adaptive funding, historical portfolio checks and stress scenarios. No guarantee of future risk compliance or lifetime solvency.')


@app.middleware('http')
async def prevent_api_response_caching(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response


@app.exception_handler(RequestValidationError)
async def validation_error_without_input(request, exc):
    # Pydantic's default includes rejected input values. Never echo credentials.
    return JSONResponse(status_code=422, content={'detail': [
        {'loc': list(error['loc']), 'msg': 'Invalid input for this field.' if error['type'] == 'extra_forbidden' else error['msg'], 'type': error['type']}
        for error in exc.errors()
    ]})


@app.get('/api/health')
def health():
    return {'status': 'ok', 'api_version': API_VERSION}


@app.get('/api/v1/reference-case')
def reference_case():
    return {
        'api_version': API_VERSION,
        'reference_initial_capital': '10000000',
        'inputs': PaymentRequest(family_mode='demo').model_dump(mode='json'),
        'policy': POLICY,
        'unresolved_policy': UNRESOLVED, 'model_assumptions':MODEL_ASSUMPTIONS,
        'scope': 'Payment schedules, CPI college reserve and explicit deterministic funding scenarios. Portfolio estimates, draft adaptive support and explicit stress scenarios are available; results remain conditional, not guarantees.',
    }


def payment_schedule(request: PaymentRequest):
    amounts = annual_payment_amounts(request.college_annual, request.adult_support_enabled,
                                     request.adult_minimum, request.adult_target)
    adult_enabled = request.adult_support_enabled
    beneficiaries, semesters = [], []
    for i, (age, degree) in enumerate(zip(request.starting_ages, request.degree_years)):
        child_id = i + 1
        timing = academic_timing(age, degree, request.model_start_date,
                                 request.first_college_years[i], request.graduation_dates[i])
        child_payments = [{**semester, 'child_id': child_id,
                           'amount_model_start_dollars': str(amounts['college'] / 2)}
                          for semester in timing['semesters']]
        semesters.extend(child_payments)
        beneficiaries.append({
            'child_id': child_id, 'starting_age': age, 'degree_years': str(degree),
            'graduation_age': timing['graduation_age'], 'graduation_age_is_approximate': True,
            'college_start_month': timing['college_start_month'],
            'graduation_month': timing['graduation_month'],
            'college_start_date': timing['college_start_date'],
            'graduation_date': timing['graduation_date'],
            'first_college_year': timing['first_college_year'],
            'adult_support_enabled': adult_enabled,
            'adult_eligibility_month': timing['graduation_month'] if adult_enabled else None,
            'first_adult_payment_month': timing['first_adult_payment_month'] if adult_enabled else None,
            'first_adult_payment_date': timing['first_adult_payment_date'] if adult_enabled else None,
            'already_graduated_at_model_start': bool(request.model_start_date and timing['graduation_date'] < request.model_start_date.isoformat()),
            'total_degree_semesters': timing['total_degree_semesters'],
            'past_semesters_excluded': timing['past_semesters'],
            'funded_semesters': len(child_payments),
            'remaining_funded_degree_years': str(Decimal(len(child_payments))/2),
            'college_obligation_model_start_dollars': str(amounts['college'] / 2 * len(child_payments)),
        })
    obligation = sum((Decimal(item['amount_model_start_dollars']) for item in semesters), Decimal(0))
    reference_settings = adult_enabled and amounts == BASE_ANNUAL_AMOUNTS
    scenario = ('college_only' if not adult_enabled else
                'reference_payment_settings' if request.family_mode == 'demo' else 'custom_payment_scenario')
    warnings = [
        'All monetary schedule outputs are model-start dollars, not projected nominal payments.',
        'The college obligation is not a valuation of the assets required today to guarantee payments.',
        'Funding adequacy, portfolio selection and mandate compliance have not been evaluated.',
        'Ages are assumed exact at model start; birth dates are inferred, not independently supplied.',
        'College is paid August 1 and January 1. Past semester dates are excluded from the remaining obligation.',
    ]
    if request.model_start_date is None:
        warnings.append('Choose a model start date to calculate academic calendar dates. No date has been silently selected.')
    if any(year is not None for year in request.first_college_years):
        warnings.append('A first college year override replaces the standard fall-after-age-18 entry assumption for that child.')
    return {
        'api_version': API_VERSION, 'status': 'payment_schedule_only',
        'calendar_timing_complete': request.model_start_date is not None,
        'inputs': request.model_dump(mode='json'),
        'policy': {**POLICY, 'starting_ages': request.starting_ages,
                   'adult_eligibility': 'graduation' if adult_enabled else None,
                   'adult_first_payment': 'one_month_after_graduation' if adult_enabled else None,
                   'adult_payment_frequency': 'monthly' if adult_enabled else None},
        'scenario': scenario, 'matches_reference_payment_amounts': reference_settings,
        'annual_amounts_model_start_dollars': {key: str(value) for key, value in amounts.items()},
        'college_semester_amount_model_start_dollars': str(amounts['college'] / 2),
        'college_obligation_model_start_dollars': str(obligation),
        'total_funded_semesters': len(semesters),
        'timeline_end_month': max(12, max((child['graduation_month'] or 0 for child in beneficiaries), default=0) + 12),
        'beneficiaries': beneficiaries, 'college_semester_payments': semesters,
        'planning_horizon_months': max(0, (80 - min(request.starting_ages)) * 12) if request.starting_ages else None,
        'unresolved_policy': UNRESOLVED, 'model_assumptions':MODEL_ASSUMPTIONS, 'warnings': warnings,
        'funding_evaluation': None, 'portfolio_evaluation': None,
    }


@app.post('/api/v1/payment-schedule')
def calculate_payments(request: PaymentRequest):
    try:
        return payment_schedule(request)
    except (ValueError, OverflowError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


class CollegePlanRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    payment_inputs: PaymentRequest
    annual_inflation_percent: Annotated[Decimal, Field(ge=-50, le=100, allow_inf_nan=False)]


@app.post('/api/v1/college-payment-plan')
def nominal_college_plan(request: CollegePlanRequest):
    from backend.college_plan import college_payment_plan
    try:
        return {'api_version':API_VERSION,'inputs':request.model_dump(mode='json'),
                **college_payment_plan(payment_schedule(request.payment_inputs),request.annual_inflation_percent)}
    except (ValueError,OverflowError) as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc


class ReserveRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    payment_inputs: PaymentRequest
    valuation_date: date
    reserve_assets: Money | None = None
    future_cpi_annual_percent: Annotated[Decimal, Field(ge=-50, le=100, allow_inf_nan=False)] | None = None


@app.post('/api/v1/college-reserve')
def calculate_college_reserve(request: ReserveRequest):
    today = eastern_today()
    start = request.payment_inputs.model_start_date
    if start is not None and start > today:
        raise HTTPException(status_code=422, detail=(
            f'Model start {start.isoformat()} is after today ({today.isoformat()}). '
            'Published CPI is not available for a future model start. Choose today or an earlier model start for a current reserve valuation; future college payments remain included.'))
    if start is not None and start < date(1913, 2, 1):
        raise HTTPException(status_code=422, detail='CPI reserve valuation requires a model start date from February 1913 onward.')
    if not date(1913, 2, 1) <= request.valuation_date <= today:
        raise HTTPException(status_code=422, detail=(
            f'Reserve valuation date must be from {max(start or date(1913, 2, 1), date(1913, 2, 1)).isoformat()} through {today.isoformat()}. '
            'This is the asset valuation date, not the college payment or graduation date.'))
    try:
        return {'api_version': API_VERSION, **reserve_valuation(
            payment_schedule(request.payment_inputs), request.valuation_date,
            request.reserve_assets, request.future_cpi_annual_percent)}
    except CPIDataError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (ValueError, OverflowError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


class AdaptivePolicy(BaseModel):
    model_config = ConfigDict(extra='forbid')
    enabled: bool = False
    real_discount_percent: Annotated[Decimal, Field(ge=-20, le=20, allow_inf_nan=False)] = Decimal('0')
    buffer_percent: Annotated[Decimal, Field(ge=0, le=100, allow_inf_nan=False)] = Decimal('0')
    terminal_real_balance: Money = Decimal('0')
    max_monthly_restoration_points: Annotated[Decimal, Field(ge=0, le=100, allow_inf_nan=False)] = Decimal('100')


class PortfolioSettings(BaseModel):
    model_config = ConfigDict(extra='forbid')
    decision_date: date
    estimation_months: Annotated[int, Field(ge=12, le=120)] = 36
    max_data_age_days: Annotated[int, Field(ge=1, le=365)] = 60
    current_weights: dict[str, Money]
    initial_allocation: bool = True
    allocation_style: Literal['lower_risk','balanced_growth','aggressive_growth','maximum_sharpe','target_return','custom'] = 'target_return'
    max_growth_fund_weight_percent: Annotated[Decimal, Field(gt=0, le=100)] = Decimal('40')
    proposed_weights: dict[str, Money] | None = None
    turnover_used_percent: Annotated[Decimal, Field(ge=0, le=100)] = Decimal('0')
    volatility_limit_percent: Annotated[Decimal, Field(gt=0, le=25)] = Decimal('25')
    turnover_limit_percent: Annotated[Decimal, Field(ge=0, le=33)] = Decimal('33')
    max_fund_weight_percent: Annotated[Decimal, Field(gt=0, le=100)] = Decimal('100')
    risk_off_equity_cap_percent: Annotated[Decimal, Field(ge=0, le=100)] = Decimal('40')
    return_target_percent: Annotated[Decimal, Field(ge=-50, le=100)] = Decimal('10')
    transaction_cost_bps: Annotated[Decimal, Field(ge=0, le=1000)] = Decimal('0')
    pilot_max_percent: Annotated[Decimal, Field(ge=0, le=100)] = Decimal('0')
    confirm_reserve_proxy: bool = False
    price_csv: Annotated[str, Field(max_length=500000)] | None = None
    source_available_on: date | None = None
    confirm_uploaded_provenance: bool = False

    @model_validator(mode='after')
    def valid_weights(self):
        if set(self.current_weights)!=set(TICKERS) or abs(sum(self.current_weights.values())-100)>Decimal('0.00001'):
            raise ValueError('Current weights need all seven tickers and must sum to100%.')
        if not self.confirm_reserve_proxy:
            raise ValueError('Confirm the SGOV reserve-proxy modelling assumption before portfolio evaluation.')
        if self.allocation_style=='custom' and (self.proposed_weights is None or set(self.proposed_weights)!=set(TICKERS) or abs(sum(self.proposed_weights.values())-100)>Decimal('0.00001')):
            raise ValueError('Proposed weights need all seven tickers and must sum to100%.')
        return self


class FundingRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    payment_inputs: PaymentRequest
    opening_balance: Money
    college_annual_return_percent: Annotated[Decimal, Field(gt=-100, le=100, allow_inf_nan=False)]
    support_annual_return_percent: Annotated[Decimal, Field(gt=-100, le=100, allow_inf_nan=False)]
    annual_cost_percent: Annotated[Decimal, Field(ge=0, lt=100, allow_inf_nan=False)] = Decimal('0')
    annual_cpi_change_percent: Annotated[Decimal, Field(ge=-50, le=100, allow_inf_nan=False)]
    reserve_transfer_rule: Literal['protect_before_payments'] = 'protect_before_payments'
    include_horizon_day_payments: Literal[True] = True
    portfolio_source: PortfolioSettings | None = None
    adaptive_policy: AdaptivePolicy = Field(default_factory=AdaptivePolicy)
    opening_transaction_cost: Money = Decimal('0')
    initial_college_shock_percent: Annotated[Decimal, Field(gt=-100, le=100, allow_inf_nan=False)] = Decimal('0')
    initial_support_shock_percent: Annotated[Decimal, Field(gt=-100, le=100, allow_inf_nan=False)] = Decimal('0')

    @model_validator(mode='after')
    def validate_funding_rules(self):
        if self.opening_transaction_cost>self.opening_balance:
            raise ValueError('Opening costs cannot exceed opening assets.')
        if self.payment_inputs.family_mode=='demo' and self.opening_balance!=10000000:
            raise ValueError('The demo opening balance is10million. Choose Your family for another balance.')
        if self.adaptive_policy.enabled and self.reserve_transfer_rule!='protect_before_payments':
            raise ValueError('Adaptive support requires protection of the full college reserve before payments.')
        return self


def resolve_funding_inputs(request):
    values=request.model_dump(mode='json');source=None
    if request.portfolio_source is not None:
        if not request.payment_inputs.model_start_date:raise ValueError('Choose a model start date first.')
        if request.portfolio_source.decision_date>eastern_today():raise ValueError('Investment decision cannot be in the future.')
        from backend.portfolio_engine import analyze
        schedule=payment_schedule(request.payment_inputs)
        source=analyze(request.portfolio_source.model_dump(mode='json')|{'model_start_date':schedule['inputs']['model_start_date']},
            float(request.opening_balance),float(schedule['college_obligation_model_start_dollars']),float(request.opening_transaction_cost))
        if source['status']=='data_quarantine':raise ValueError('Portfolio data quarantined: '+' '.join(source['data_card']['reasons']))
        candidate=source['candidate']
        if candidate is None:raise ValueError('No portfolio candidate satisfies the selected constraints. Revise Portfolio & stress or use explicit manual return assumptions.')
        values['college_annual_return_percent']=str(candidate['college_scenario_return_percent'])
        values['support_annual_return_percent']=str(candidate['support_scenario_return_percent'])
        values['opening_transaction_cost']=str(request.opening_transaction_cost+Decimal(str(candidate['proposed_transaction_cost'])))
        values['portfolio_source']=None
    return values,source


@app.post('/api/v1/funding-projection')
def calculate_funding_projection(request: FundingRequest):
    from backend.product_evaluation import run_funding
    try:
        values,source=resolve_funding_inputs(request)
        return {'api_version':API_VERSION,'inputs':request.model_dump(mode='json'),
            'calculation_inputs':values,'investment_source':source,**run_funding(payment_schedule(request.payment_inputs),values)}
    except (ValueError,OverflowError) as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc


from backend.portfolio_engine import panel_info, TICKERS
from backend.product_evaluation import evaluate_product


class StressSettings(BaseModel):
    model_config = ConfigDict(extra='forbid')
    enabled: bool = True
    support_loss_percent: Annotated[Decimal, Field(gt=-100, le=0)] = Decimal('-35')
    college_loss_percent: Annotated[Decimal, Field(gt=-100, le=0)] = Decimal('-1')
    inflation_increase_points: Annotated[Decimal, Field(ge=0, le=20)] = Decimal('2')
    return_reduction_points: Annotated[Decimal, Field(ge=0, le=30)] = Decimal('3')
    cost_increase_points: Annotated[Decimal, Field(ge=0, le=20)] = Decimal('0.5')
    longevity_extension_years: Annotated[int, Field(ge=0, le=20)] = 10
    short_window_months: Annotated[int, Field(ge=12, le=120)] = 12
    long_window_months: Annotated[int, Field(ge=12, le=120)] = 60
    trade_cost_increase_bps: Annotated[Decimal, Field(ge=0, le=1000)] = Decimal('25')
    tighter_volatility_percent: Annotated[Decimal, Field(gt=0, le=25)] = Decimal('10')
    tighter_fund_cap_percent: Annotated[Decimal, Field(gt=0, le=100)] = Decimal('60')

class EvaluationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    funding: FundingRequest
    portfolio: PortfolioSettings
    stress: StressSettings = Field(default_factory=StressSettings)
    use_historical_proxy_returns: bool = False

class PortfolioEstimateRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    payment_inputs: PaymentRequest
    opening_balance: Money
    opening_transaction_cost: Money = Decimal('0')
    portfolio: PortfolioSettings


@app.post('/api/v1/portfolio-estimate')
def portfolio_estimate(request: PortfolioEstimateRequest):
    from backend.portfolio_engine import analyze
    if request.portfolio.decision_date>eastern_today():raise HTTPException(status_code=422,detail='Investment decision cannot be in the future.')
    try:
        schedule=payment_schedule(request.payment_inputs)
        if not schedule['inputs']['model_start_date']:raise ValueError('Choose and update a model start date first.')
        if request.opening_transaction_cost>request.opening_balance:raise ValueError('Opening costs cannot exceed assets.')
        if request.payment_inputs.family_mode=='demo' and request.opening_balance!=10000000:raise ValueError('Demo opening assets must be10million.')
        result=analyze(request.portfolio.model_dump(mode='json')|{'model_start_date':schedule['inputs']['model_start_date']},
            float(request.opening_balance),float(schedule['college_obligation_model_start_dollars']),float(request.opening_transaction_cost))
        return {'api_version':API_VERSION,'inputs':request.model_dump(mode='json'),**result}
    except (ValueError,OverflowError) as exc:raise HTTPException(status_code=422,detail=str(exc)) from exc


@app.post('/api/v1/portfolio-cases')
def portfolio_cases(request: PortfolioEstimateRequest):
    # Preview only: no cash-flow projection, recommendation or Monte Carlo run.
    cases={}
    for style in ('lower_risk','balanced_growth','aggressive_growth'):
        portfolio=request.portfolio.model_copy(update={'allocation_style':style,'max_growth_fund_weight_percent':Decimal('40'),'proposed_weights':None})
        value=portfolio_estimate(request.model_copy(update={'portfolio':portfolio}))
        cases[style]=value
    return {'api_version':API_VERSION,'cases':cases,'data_card':next(iter(cases.values()))['data_card']}


class PortfolioSimulationRequest(PortfolioEstimateRequest):
    years: Annotated[int, Field(ge=1, le=100)] = 30
    paths: Literal[1000,5000,10000,20000] = 5000
    seed: Annotated[int, Field(ge=0, le=2147483647)] = 439
    scope: Literal['long_term','whole_trust'] = 'long_term'
    annual_cost_percent: Annotated[Decimal, Field(ge=0, lt=100, allow_inf_nan=False)] = Decimal('0')


@app.post('/api/v1/portfolio-simulation')
def portfolio_simulation(request: PortfolioSimulationRequest):
    from backend.portfolio_engine import prepare_data
    from backend.portfolio_simulation import simulate_growth
    try:
        estimated=portfolio_estimate(PortfolioEstimateRequest(**request.model_dump(include=set(PortfolioEstimateRequest.model_fields))))
        candidate=estimated['candidate']
        if candidate is None:raise ValueError('A data-admitted candidate passing every hard check is required before simulation.')
        weights=candidate['support_weights'] if request.scope=='long_term' else candidate['weights']
        if not weights:raise ValueError('No long-term assets remain after the college earmark. Choose whole-trust scope or revise the inputs.')
        _,data=prepare_data(request.portfolio.model_dump(mode='json')|{'model_start_date':request.payment_inputs.model_start_date.isoformat()})
        result=simulate_growth(data,{t:weights[t]/100 for t in TICKERS},request.years,request.paths,request.seed,float(request.annual_cost_percent))
        return {'api_version':API_VERSION,'inputs':request.model_dump(mode='json'),'data_card':estimated['data_card'],
                'weights':weights,'allocation_label':candidate.get('allocation_label'),**result}
    except (ValueError,OverflowError) as exc:raise HTTPException(status_code=422,detail=str(exc)) from exc


@app.get('/api/v1/investment-data')
def investment_data():
    return {**panel_info(),'today_eastern':eastern_today().isoformat()}

@app.post('/api/v1/evaluate')
def evaluate(request: EvaluationRequest):
    if request.portfolio.decision_date>eastern_today():
        raise HTTPException(status_code=422,detail='A published-data investment decision cannot be in the future.')
    try:
        schedule=payment_schedule(request.funding.payment_inputs)
        if not schedule['inputs']['model_start_date']:raise ValueError('Choose a model start date first.')
        result=evaluate_product(schedule,request.funding.model_dump(mode='json'),request.portfolio.model_dump(mode='json'),request.stress.model_dump(mode='json'),request.use_historical_proxy_returns or request.funding.portfolio_source is not None)
        return {'api_version':API_VERSION,'inputs':request.model_dump(mode='json'),**result}
    except (ValueError,OverflowError) as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.post('/api/v1/validate-funding-plan')
def validate_funding_plan(request: FundingRequest):
    # Validation/import deliberately performs no investment run or forecasting.
    try:
        payment_schedule(request.payment_inputs)
        return {'inputs':request.model_dump(mode='json')}
    except ValueError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.post('/api/v1/validate-analysis-plan')
def validate_analysis_plan(request: EvaluationRequest):
    try:
        payment_schedule(request.funding.payment_inputs)
        return {'inputs':request.model_dump(mode='json')}
    except ValueError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc
