import {adminSession,sameOrigin,json,failure} from '@/lib/portal/server';
import {settings} from '@/db/schema';import {eq} from 'drizzle-orm';
export async function POST(req:Request){try{sameOrigin(req);const s=await adminSession();await s.db.update(settings).set({credential:null}).where(eq(settings.id,1));return json({disconnected:true});}catch(e){return failure(e);}}
