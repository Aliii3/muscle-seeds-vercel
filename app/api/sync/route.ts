import {session,sameOrigin,json,failure,syncShop} from '@/lib/portal/server';
export async function POST(req:Request){try{sameOrigin(req);return json(await syncShop(await session()));}catch(e){return failure(e);}}
