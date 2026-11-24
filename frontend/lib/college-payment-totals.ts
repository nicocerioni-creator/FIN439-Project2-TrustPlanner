import type {CollegePaymentPlan} from './api';

const ZERO=BigInt(0),HUNDRED=BigInt(100);

// Sum the displayed payment lines only. Inflation calculations remain in Python.
// Integer cents preserve the backend's per-semester rounding exactly.
function cents(amount:string):bigint {
 const match=/^(\d+)(?:\.(\d{1,2}))?$/.exec(amount);
 if(!match)throw new Error('College payment amounts must be nonnegative dollar amounts rounded to cents.');
 return BigInt(match[1])*HUNDRED+BigInt((match[2]??'').padEnd(2,'0'));
}
function dollars(amount:bigint):string {
 return `${amount/HUNDRED}.${(amount%HUNDRED).toString().padStart(2,'0')}`;
}

export function summarizeCollegePayments(paymentDates:CollegePaymentPlan['payment_dates']) {
 const byChild=new Map<number,bigint>();let total=ZERO;
 const dates=paymentDates.map(row=>{
  let due=ZERO;
  for(const payment of row.payments){
   const amount=cents(payment.amount_nominal_dollars);
   byChild.set(payment.child_id,(byChild.get(payment.child_id)??ZERO)+amount);
   due+=amount;
  }
  total+=due;
  return {...row,total_nominal_dollars:dollars(due)};
 });
 return {paymentDates:dates,totalNominalDollars:dollars(total),
  childTotal:(childId:number)=>dollars(byChild.get(childId)??ZERO)};
}
