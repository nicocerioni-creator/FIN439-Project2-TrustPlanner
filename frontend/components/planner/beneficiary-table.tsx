import type { Beneficiary } from '@/lib/api';
import { formatMoney, formatTiming, formatYears } from '@/lib/format';
import { TableScroll, tableCell, tableHead } from './primitives';

function Timing({ date, month }: { date: string | null; month: number | null }) {
  const text = formatTiming(date, month);
  if (!text) return <span className="text-slate-500">Choose model start date</span>;
  return (
    <>
      <span className="whitespace-nowrap font-medium text-navy-900">{text}</span>
      {month !== null && <span className="block text-xs text-slate-500">month {month}</span>}
    </>
  );
}

export function BeneficiaryTable({ beneficiaries }: { beneficiaries: Beneficiary[] }) {
  return (
    <TableScroll>
      <table className="w-full min-w-[720px] border-separate border-spacing-0 tabular-nums">
        <caption className="sr-only">College start, graduation, funded semesters and first adult payment for each child</caption>
        <thead>
          <tr>
            <th scope="col" className={`${tableHead} sticky left-0 z-10 rounded-tl-md`}>Child</th>
            <th scope="col" className={tableHead}>College starts</th>
            <th scope="col" className={tableHead}>Graduation</th>
            <th scope="col" className={tableHead}>First adult payment</th>
            <th scope="col" className={`${tableHead} text-right`}>Funded semesters</th>
          </tr>
        </thead>
        <tbody>
          {beneficiaries.map(child => (
            <tr key={child.child_id}>
              <th scope="row" className={`${tableCell} sticky left-0 z-10 bg-white text-left font-semibold text-navy-900`}>
                Child {child.child_id}
                <span className="block text-xs font-normal text-slate-500">
                  Age {child.starting_age} · {formatYears(child.degree_years)} degree
                </span>
              </th>
              <td className={tableCell}>
                <Timing date={child.college_start_date} month={child.college_start_month} />
              </td>
              <td className={tableCell}>
                <Timing date={child.graduation_date} month={child.graduation_month} />
                {child.graduation_age !== null && <span className="block text-xs text-slate-500">Approx. age {Number(child.graduation_age)}</span>}
                {child.already_graduated_at_model_start && <span className="block text-xs text-slate-500">Graduated before model start</span>}
              </td>
              <td className={tableCell}>
                {child.adult_support_enabled ? (
                  <Timing date={child.first_adult_payment_date} month={child.first_adult_payment_month} />
                ) : (
                  <span className="text-slate-600">None: adult support is off</span>
                )}
              </td>
              <td className={`${tableCell} text-right`}>
                <span className="font-medium text-navy-900">{child.funded_semesters}</span>
                <span className="block text-xs text-slate-500">
                  {formatMoney(child.college_obligation_model_start_dollars)}
                </span>
                {child.past_semesters_excluded > 0 && <span className="block text-xs text-slate-500">{child.past_semesters_excluded} past semesters excluded</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
