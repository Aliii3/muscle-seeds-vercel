import 'server-only';
import {createClient} from '@libsql/client';
import {drizzle} from 'drizzle-orm/libsql';
import * as schema from './schema';
function createDb(){
 const url=process.env.TURSO_DATABASE_URL;
 if(!url)throw new Error('Set TURSO_DATABASE_URL before connecting to the database.');
 return drizzle(createClient({url,authToken:process.env.TURSO_AUTH_TOKEN}),{schema});
}
let db:ReturnType<typeof createDb>|undefined;
export function getDb(){return db??=createDb();}
