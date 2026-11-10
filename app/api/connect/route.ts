import {adminSession,sameOrigin,json,failure,PortalError,shopDomain,verifyConnection,seal} from '@/lib/portal/server';
import {settings} from '@/db/schema';import {eq} from 'drizzle-orm';
export async function POST(req:Request){try{sameOrigin(req);const s=await adminSession();const b=await req.json() as Record<string,string>;const domain=shopDomain(b.domain||'');
if(s.config.domain&&s.config.domain!==domain)throw new PortalError('This portal is bound to your original store. Reconnect using the same .myshopify.com domain.');
const mode=b.mode==='token'?'token':'client';const credentials=mode==='token'?{token:(b.token||'').trim()}:{clientId:(b.clientId||'').trim(),clientSecret:(b.clientSecret||'').trim()};
if(Object.values(credentials).some(v=>!v||v.length>500))throw new PortalError('Complete the connection fields.');const currency=await verifyConnection(domain,credentials);const credential=await seal(credentials);
await s.db.update(settings).set({domain,credential,currency,authMode:mode}).where(eq(settings.id,1));return json({connected:true});}catch(e){return failure(e);}}
