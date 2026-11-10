export type SaleOrder = {id:string;name:string;createdAt:string;updatedAt:string;codes:string[];status:string;cancelledAt:string|null;test:boolean;collected:number;refunded:number;currency:string};
export const normalizeCode = (code:string) => code.trim().toUpperCase();
// Integer minor units keep currency calculations exact throughout reporting.
export function moneyToMinor(amount:string): number {
 if (!/^-?\d+(\.\d{1,2})?$/.test(amount)) throw new Error("Unsupported money format");
 const neg=amount.startsWith('-'), [whole,fraction='']=amount.replace('-','').split('.');
 const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(result)) throw new Error('Money amount out of range');
 return neg ? -result : result;
}
export function netSales(order:SaleOrder):number {
 if(order.test || order.cancelledAt || !['PAID','PARTIALLY_REFUNDED'].includes(order.status)) return 0;
 return Math.max(0,order.collected-order.refunded);
}
export function cairoDay(date:string):string {
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
}
export function isInRange(order:SaleOrder,from:string,to:string):boolean {
 const day=cairoDay(order.createdAt); return (!from||day>=from)&&(!to||day<=to);
}
export function attributeCode(codes:string[],known:Set<string>):string|null {
 const matched=[...new Set(codes.map(normalizeCode).filter(c=>known.has(c)))];
 // Never double-credit ambiguous orders that contain multiple creators' codes.
 return matched.length===1 ? matched[0] : null;
}
