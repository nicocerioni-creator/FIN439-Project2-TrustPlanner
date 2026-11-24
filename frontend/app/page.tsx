'use client';

import { PlannerApp } from '@/components/planner/planner-app';
import { usePaymentPlan } from '@/hooks/use-payment-plan';

export default function Page() {
  const session = usePaymentPlan();
  return <PlannerApp session={session} />;
}
