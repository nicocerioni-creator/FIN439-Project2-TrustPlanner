"""Adopted model policy is distinguished from limitations and private exports."""
from pathlib import Path
import unittest
from fastapi.testclient import TestClient
from backend.main import app
from scripts.source_package import forbidden_name

class EvidencePolicyTests(unittest.TestCase):
 def test_adopted_policy_keeps_limitations_and_compatibility_explicit(self):
  client=TestClient(app)
  reference=client.get('/api/v1/reference-case').json()
  result=client.post('/api/v1/payment-schedule',json=reference['inputs']).json()
  for value in [reference,result]:
   self.assertEqual(value['unresolved_policy'],[])
   self.assertGreaterEqual(len(value['model_assumptions']),4)
   self.assertEqual(value['policy']['college_backing_proxy'],'SGOV')
   self.assertEqual(value['policy']['hard_check_failure_response'],'reject_proposed_allocation_and_review')
   self.assertTrue(value['policy']['include_youngest_80th_birthday_payments'])
   self.assertEqual(value['policy']['future_monitoring'],'not_simulated_no_future_limit_guarantee')
 def test_user_evidence_exports_are_excluded_from_source_packages(self):
  for name in ['trust_evidence_record.json','trust_results_summary.html','college_calendar.csv','trust_analysis_settings.json']:
   self.assertTrue(forbidden_name(Path('frontend/handoff')/name),name)

if __name__=='__main__':unittest.main()
