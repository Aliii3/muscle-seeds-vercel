import {portalData,json,failure} from '@/lib/portal/server';
export const dynamic='force-dynamic';
export async function GET(){try{return json(await portalData());}catch(e){return failure(e);}}
