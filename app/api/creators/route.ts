import {adminSession,sameOrigin,json,failure,PortalError} from '@/lib/portal/server';
import {creators} from '@/db/schema';
import {eq,or} from 'drizzle-orm';
import {normalizeCode} from '@/lib/portal/rules';
export async function POST(req:Request){try{sameOrigin(req);const s=await adminSession();const body=await req.json() as Record<string,unknown>;const name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase(),code=normalizeCode(String(body.code||''));
if(!name||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!code||code.length>100||/[\x00-\x1f]/.test(code))throw new PortalError('Enter a name, valid email, and existing promo code.');
if(email===s.user.email.toLowerCase())throw new PortalError('Use the creator’s email, separate from your admin account.');
if(await s.db.select().from(creators).where(or(eq(creators.email,email),eq(creators.code,code))).get())throw new PortalError('That email or promo code is already assigned.');
await s.db.insert(creators).values({id:crypto.randomUUID(),name,email,code,createdAt:new Date().toISOString()});return json({saved:true});}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{sameOrigin(req);const s=await adminSession();const {id}=await req.json() as {id:string};await s.db.delete(creators).where(eq(creators.id,id));return json({removed:true});}catch(e){return failure(e);}}
