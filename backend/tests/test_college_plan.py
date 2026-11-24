"""Nominal calendar correctness, independent of the locked investment experiment."""
from datetime import date
from decimal import Decimal
from pathlib import Path
import sys,unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from fastapi.testclient import TestClient
from backend.main import app,PaymentRequest,payment_schedule
from backend.college_plan import college_payment_plan
from backend.funding_projection import project_funding

class CollegePlanTests(unittest.TestCase):
 def test_inflation_edits_reconcile_each_child_to_its_own_remaining_payments(self):
  c=TestClient(app)
  inputs=PaymentRequest(model_start_date=date(2026,1,1),starting_ages=[18,19,30],degree_years=['2','1.5','1'],
     first_college_years=[2026,2025,2000],college_annual='100').model_dump(mode='json')
  previous=None
  for rate in ('-3','0','3','6'):
   response=c.post('/api/v1/college-payment-plan',json={'payment_inputs':inputs,'annual_inflation_percent':rate})
   self.assertEqual(response.status_code,200,response.text);result=response.json()
   values=[]
   for child in result['children']:
    payments=[Decimal(p['amount_nominal_dollars']) for row in result['payment_dates'] for p in row['payments'] if p['child_id']==child['child_id']]
    total=Decimal(child['total_nominal_dollars']);self.assertEqual(total,sum(payments,Decimal(0)));values.append(total)
   self.assertEqual(values[2],0)  # Already graduated; never assigned another child's obligations.
   self.assertEqual(Decimal(result['total_nominal_dollars']),sum(values,Decimal(0)))
   if previous:self.assertTrue(all(v>before for v,before in zip(values[:2],previous[:2])))
   if rate=='0':self.assertEqual(values,[Decimal('200'),Decimal('100'),Decimal('0')])
   previous=values

 def test_date_grouping_nominal_amounts_and_funding_agree(self):
  schedule=payment_schedule(PaymentRequest(model_start_date=date(2026,1,1),starting_ages=[18,18],degree_years=['1','1'],college_annual='100',adult_support_enabled=False))
  plan=college_payment_plan(schedule,Decimal('12'))
  self.assertEqual([r['date'] for r in plan['payment_dates']],['2026-08-01','2027-01-01'])
  self.assertTrue(all(len(r['payments'])==2 for r in plan['payment_dates']))
  self.assertGreater(Decimal(plan['payment_dates'][1]['payments'][0]['amount_nominal_dollars']),50)
  self.assertEqual(sum((Decimal(c['total_nominal_dollars']) for c in plan['children']),Decimal(0)),Decimal(plan['total_nominal_dollars']))
  funding=project_funding(schedule,'10000','0','0','0','12','protect_before_payments',True)
  self.assertEqual(funding['paths']['college_only']['total_college_payments'],plan['total_nominal_dollars'])
  for row in plan['payment_dates']:
   ledger=next(r for r in funding['paths']['college_only']['monthly_ledger'] if r['month']==row['date'][:7])
   self.assertEqual(ledger['college_due'],row['total_nominal_dollars'])

 def test_remaining_years_exclude_past_semesters_and_keep_long_degrees(self):
  schedule=payment_schedule(PaymentRequest(model_start_date=date(2026,8,1),starting_ages=[20,18],degree_years=['4','5'],first_college_years=[2024,None]))
  a,b=schedule['beneficiaries'];self.assertEqual(a['funded_semesters'],4);self.assertEqual(a['remaining_funded_degree_years'],'2')
  self.assertEqual(b['funded_semesters'],10);self.assertEqual(b['remaining_funded_degree_years'],'5')
  result=college_payment_plan(schedule,Decimal('0'))
  self.assertEqual(Decimal(result['total_nominal_dollars']),Decimal(schedule['college_obligation_model_start_dollars']))

 def test_deflation_and_first_day_reset_from_midmonth_start(self):
  schedule=payment_schedule(PaymentRequest(model_start_date=date(2026,11,23),starting_ages=[18],degree_years=['1'],first_college_years=[2026],college_annual='100'))
  result=college_payment_plan(schedule,Decimal('-12'))
  self.assertEqual(len(result['payment_dates']),1)
  amount=Decimal(result['total_nominal_dollars'])
  self.assertLess(amount,50);self.assertEqual(amount,(Decimal(50)*Decimal('.88')**(Decimal(2)/12)).quantize(Decimal('.01')))
  schedule['planning_horizon_months']=0
  self.assertEqual(college_payment_plan(schedule,Decimal('-12'))['total_nominal_dollars'],str(amount))

 def test_api_requires_explicit_inflation_and_model_date(self):
  c=TestClient(app);inputs=PaymentRequest().model_dump(mode='json')
  self.assertEqual(c.post('/api/v1/college-payment-plan',json={'payment_inputs':inputs,'annual_inflation_percent':'3'}).status_code,422)
  inputs['model_start_date']='2027-05-31'
  body={'payment_inputs':inputs,'annual_inflation_percent':'3'}
  self.assertEqual(c.post('/api/v1/college-payment-plan',json=body).status_code,200)
  self.assertEqual(c.post('/api/v1/college-payment-plan',json={'payment_inputs':inputs}).status_code,422)
  self.assertEqual(c.post('/api/v1/college-payment-plan',json=body|{'annual_inflation_percent':'-50.01'}).status_code,422)
