import 'server-only';
import { eq, and, or, isNull, lt } from 'drizzle-orm';
import { getDb } from '@/db';
import { settings, creators, orders } from '@/db/schema';
import { getPortalUser } from '@/lib/auth';
import { attributeCode, moneyToMinor, type SaleOrder } from './rules';
export class PortalError extends Error { constructor(message:string, public status=400){super(message);} }
export const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export function failure(error:unknown){return json({error:error instanceof PortalError?error.message:'Something went wrong. Please try again.'},error instanceof PortalError?error.status:500);}
export function sameOrigin(req:Request){const expected=process.env.APP_URL?new URL(process.env.APP_URL).origin:new URL(req.url).origin;if(req.headers.get('origin')!==expected)throw new PortalError('Request origin is not allowed.',403);}
export async function session(){
 const user=await getPortalUser();if(!user)throw new PortalError('Please sign in to continue.',401);
 const adminEmail=process.env.ADMIN_EMAIL?.trim().toLowerCase();
 if(!adminEmail)throw new PortalError('The administrator email has not been configured.',503);
 const designatedAdmin=user.email===adminEmail;
 const db=getDb(); let config=await db.select().from(settings).get();
 if(!config&&!designatedAdmin)throw new PortalError('The administrator must finish setup before creators can sign in.',403);
 if(!config){await db.insert(settings).values({id:1,ownerId:user.userId}).onConflictDoNothing();config=await db.select().from(settings).get();}
 if(!config)throw new PortalError('Setup is not ready.',503);
 const admin=designatedAdmin&&config.ownerId===user.userId;
 const creator=admin?null:await db.select().from(creators).where(eq(creators.email,user.email.toLowerCase())).get();
 if(!admin&&!creator)throw new PortalError('Your email has not been added to this creator program. Ask Muscle Seeds to add the email you use to sign in.',403);
 if(creator?.userId&&creator.userId!==user.userId)throw new PortalError('This creator account is already linked to another sign-in.',403);
 if(creator&&!creator.userId){await db.update(creators).set({userId:user.userId}).where(and(eq(creators.id,creator.id),isNull(creators.userId)));const bound=await db.select().from(creators).where(eq(creators.id,creator.id)).get();if(bound?.userId!==user.userId)throw new PortalError('Account could not be linked.',403);}
 return {db,user,config,admin,creator};
}
export async function adminSession(){const s=await session();if(!s.admin)throw new PortalError('Admin access required.',403);return s;}
export async function seal(value:unknown){
 const secret=process.env.CREDENTIAL_ENCRYPTION_KEY;
 if(!secret)throw new PortalError('Secure connection setup is unavailable. Contact the site owner.',503);
 const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(secret),c=>c.charCodeAt(0)),'AES-GCM',false,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(value)));
 return btoa(String.fromCharCode(...iv,...new Uint8Array(cipher)));
}
async function unseal(cipher:string){
 const secret=process.env.CREDENTIAL_ENCRYPTION_KEY;if(!secret)throw new PortalError('Secure connection setup is unavailable.',503);
 const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(secret),c=>c.charCodeAt(0)),'AES-GCM',false,['decrypt']);const bytes=Uint8Array.from(atob(cipher),c=>c.charCodeAt(0));
 return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},key,bytes.slice(12))));
}
export function shopDomain(input:string){
 const domain=input.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
 if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain))throw new PortalError('Enter the original .myshopify.com address from Shopify Settings → Domains.');return domain;
}
type Credential={token?:string;clientId?:string;clientSecret?:string};
async function accessToken(domain:string,credential:Credential){
 if(credential.token)return credential.token;
 const r=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:credential.clientId||'',client_secret:credential.clientSecret||''}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new PortalError('Shopify rejected the app credentials. Check that the app is installed and belongs to the same organization as your store.');
 const data=await r.json() as {access_token?:string};if(!data.access_token)throw new PortalError('Shopify did not return an access token.');return data.access_token;
}
export async function graph(domain:string,token:string,query:string,variables:Record<string,unknown>={}){
 const r=await fetch(`https://${domain}/admin/api/2026-10/graphql.json`,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new PortalError(r.status===401?'Shopify access has expired. Reconnect your store.':'Shopify could not be reached. Please retry.',502);
 const data=await r.json() as {errors?:unknown[];data?:any};if(data.errors?.length||!data.data)throw new PortalError('Shopify could not provide order data. Check the app’s read_orders permission and try again.',502);return data.data;
}
export async function verifyConnection(domain:string,credential:Credential){
 const token=await accessToken(domain,credential);
 const d=await graph(domain,token,'{ shop { currencyCode } orders(first: 1) { nodes { id } } }');
 if(d.shop.currencyCode!=='EGP')throw new PortalError('This version supports your EGP store. A different store currency needs currency precision configuration.');return d.shop.currencyCode as string;
}
export async function syncShop(s:Awaited<ReturnType<typeof session>>){
 const {db,config}=s;if(!config.domain||!config.credential)return {connected:false};
 const now=Date.now();if(config.lastSync&&!config.syncCursor&&now-new Date(config.lastSync).getTime()<55000)return {fresh:true};
 const lock=await db.update(settings).set({syncLock:now}).where(and(eq(settings.id,1),or(isNull(settings.syncLock),lt(settings.syncLock,now-180000)))).returning({id:settings.id});
 if(!lock.length)return {syncing:true};
 try{
 const token=await accessToken(config.domain,await unseal(config.credential));
 const started=config.syncStarted||new Date().toISOString();
 // Initial import is limited to Shopify's standard 60-day history; follow-up queries use updated_at.
 const since=config.lastSync?new Date(new Date(config.lastSync).getTime()-120000).toISOString():new Date(new Date(started).getTime()-60*86400000).toISOString();
 let cursor=config.syncCursor;let more=false;let count=0;
 for(let page=0;page<1;page++){
 const d=await graph(config.domain,token,`query Orders($cursor:String,$query:String!){orders(first:100,after:$cursor,sortKey:UPDATED_AT,query:$query){nodes{id name createdAt updatedAt discountCodes displayFinancialStatus cancelledAt test totalReceivedSet{shopMoney{amount currencyCode}} totalRefundedSet{shopMoney{amount currencyCode}}}pageInfo{hasNextPage endCursor}}}`,{cursor,query:`updated_at:>='${since}'`});
 for(let i=0;i<d.orders.nodes.length;i+=40){const batch=d.orders.nodes.slice(i,i+40).map((o:any)=>{const row={id:o.id,name:o.name,createdAt:o.createdAt,updatedAt:o.updatedAt,codes:JSON.stringify(o.discountCodes.map((c:string)=>c.trim().toUpperCase())),status:o.displayFinancialStatus,cancelledAt:o.cancelledAt,test:o.test,collected:moneyToMinor(o.totalReceivedSet.shopMoney.amount),refunded:moneyToMinor(o.totalRefundedSet.shopMoney.amount),currency:o.totalReceivedSet.shopMoney.currencyCode};return db.insert(orders).values(row).onConflictDoUpdate({target:orders.id,set:row});});if(batch.length)await db.batch(batch as any);}
 count+=d.orders.nodes.length;more=d.orders.pageInfo.hasNextPage;cursor=more?d.orders.pageInfo.endCursor:null;
 // Save progress after every page so a failed sync is safely resumable.
 await db.update(settings).set({syncCursor:cursor,syncStarted:more?started:null,...(!more?{lastSync:started}: {})}).where(eq(settings.id,1));
 if(!more)break;
 }
 return {updated:count,more};
 }finally{await db.update(settings).set({syncLock:null}).where(and(eq(settings.id,1),eq(settings.syncLock,now)));}
}
export async function portalData(){
 const s=await session();const list=await s.db.select().from(creators);const known=new Set(list.map(c=>c.code));
 const raw=await s.db.select().from(orders);const sales=raw.map(o=>({...o,codes:JSON.parse(o.codes) as string[]})).filter(o=>o.currency===s.config.currency);
 const selected=s.admin?list:list.filter(c=>c.id===s.creator?.id);const allowed=new Set(selected.map(c=>c.code));
 const attributed=sales.flatMap(o=>{const code=attributeCode(o.codes,known);if(!code||!allowed.has(code))return [];return [{...o,codes:[code]} as SaleOrder];});
 return {admin:s.admin,name:s.admin?'Muscle Seeds':s.creator!.name,email:s.user.email,connected:!!s.config.credential,domain:s.config.domain,currency:s.config.currency,lastSync:s.config.lastSync,more:!!s.config.syncCursor,creators:selected.map(c=>({id:c.id,name:c.name,email:c.email,code:c.code})),orders:attributed};
}
