import type {SaleOrder} from './rules';
export const demoCreators=[{id:'demo-1',name:'Omar Hassan',email:'omar@example.com',code:'OMAR10'},{id:'demo-2',name:'Nour Ahmed',email:'nour@example.com',code:'NOUR10'},{id:'demo-3',name:'Youssef Ali',email:'youssef@example.com',code:'YOUSEF10'}];
export function demoOrders():SaleOrder[]{
 const end=new Date();const rows:SaleOrder[]=[];
 for(let i=0;i<38;i++){const day=new Date(end);day.setUTCDate(day.getUTCDate()-(i%28));day.setUTCHours(10+(i%8),20,0,0);const status=i===0?'PENDING':i===1?'REFUNDED':i===2?'PAID':i===3?'PARTIALLY_REFUNDED':'PAID';
 rows.push({id:`demo-order-${i}`,name:`#MS${1286-i}`,createdAt:day.toISOString(),updatedAt:day.toISOString(),codes:[demoCreators[i%3].code],status,cancelledAt:i===2?day.toISOString():null,test:false,collected:status==='PENDING'?0:[45000,100000,77500,220000,50000,150000][i%6],refunded:status==='REFUNDED'?100000:status==='PARTIALLY_REFUNDED'?45000:0,currency:'EGP'});}
 return rows;
}
