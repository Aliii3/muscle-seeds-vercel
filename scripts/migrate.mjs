import {config} from 'dotenv';
import {createClient} from '@libsql/client';
import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
config({path:'.env.local',quiet:true});
config({quiet:true});
if(!process.env.TURSO_DATABASE_URL)throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local first.');
const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 await client.execute('CREATE TABLE IF NOT EXISTS _portal_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()){
  const sql=await readFile(new URL('../migrations/'+name,import.meta.url),'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');
  const previous=await client.execute({sql:'SELECT checksum FROM _portal_migrations WHERE name=?',args:[name]});
  if(previous.rows.length){if(previous.rows[0].checksum!==checksum)throw new Error('Applied migration changed: '+name);continue;}
  const statements=sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
  await client.batch([...statements,{sql:'INSERT INTO _portal_migrations(name,checksum) VALUES (?,?)',args:[name,checksum]}],'write');
  console.log('Applied '+name);
 }
 console.log('Database is ready.');
}finally{client.close();}
