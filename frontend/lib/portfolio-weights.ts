export const portfolioTickers=['VOO','QQQ','SCHD','PAVE','XLE','XLV','SGOV'];

// Use basis points so every slider edit preserves exactly100.00%.
export function adjustPortfolioWeight(weights:Record<string,string>,ticker:string,value:string):Record<string,string>{
 const units=Object.fromEntries(portfolioTickers.map(t=>[t,Math.round(Number(weights[t]??0)*100)]));
 const wanted=Math.max(0,Math.min(10000,Math.round(Number(value)*100)));
 if(!Number.isFinite(wanted))return weights;
 if(ticker!=='SGOV'){
  const otherEquity=portfolioTickers.filter(t=>t!==ticker&&t!=='SGOV').reduce((sum,t)=>sum+units[t],0);
  units[ticker]=Math.min(wanted,10000-otherEquity);units.SGOV=10000-otherEquity-units[ticker];
 }else{
  units.SGOV=wanted;const equity=portfolioTickers.filter(t=>t!=='SGOV');
  const existing=equity.reduce((sum,t)=>sum+units[t],0),remaining=10000-wanted;
  let left=remaining;
  equity.forEach((t,i)=>{const next=i===equity.length-1?left:Math.min(left,Math.floor(remaining*(existing?units[t]/existing:1/equity.length)));units[t]=next;left-=next;});
 }
 return Object.fromEntries(portfolioTickers.map(t=>[t,(units[t]/100).toFixed(2)]));
}
