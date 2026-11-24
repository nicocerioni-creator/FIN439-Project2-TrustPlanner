import type { PaymentInput, PaymentResult, ReferenceCase, FundingRequest, FundingResult, FundingPath, EvaluationRequest, EvaluationResult, CollegePaymentPlan, PortfolioSettings } from '@/lib/api';

export type CalculationRecord<T> = {result:T|null;current:boolean;loading:boolean;error:string;calculatedAt:string|null};
export type FundingRecord = CalculationRecord<FundingResult>&{request:FundingRequest|null;selectedPath:FundingPath['path']};
export type PortfolioRecord = CalculationRecord<EvaluationResult>&{request:EvaluationRequest|null;estimateCurrent:boolean;settings:PortfolioSettings};
export type CollegeRecord = CalculationRecord<CollegePaymentPlan>;

export type View = 'plan' | 'reserve' | 'funding' | 'portfolio' | 'evidence';

/**
 * Everything the interface needs to render. The live app builds this from the
 * Python API (hooks/use-payment-plan.ts); the illustrative preview builds it from
 * the supplied reference response. The session owns family state; funding/college/portfolio components request Python calculations separately.
 */
export type PlanSession = {
  mode: 'live' | 'illustrative';
  reference: ReferenceCase | null;
  input: PaymentInput | null;
  result: PaymentResult | null;
  stale: boolean;
  loading: boolean;
  error: string;
  canExport: boolean;
  onChange: <K extends keyof PaymentInput>(key: K, value: PaymentInput[K]) => void;
  onFamilyModeChange: (mode: PaymentInput['family_mode']) => void;
  onUpdate: () => void;
  onRefreshPaymentPlan?: () => Promise<PaymentResult>;
  onRetry: () => void;
  onDownload: () => void;
  onImportPaymentPlan?: (input: PaymentInput) => Promise<void>;
};
