import {getPortalUser} from '@/lib/auth';
import {getClient} from '@/db';
import {initialMigration} from '@/db/initial-migration';
import {sameOrigin,json,failure,PortalError} from '@/lib/portal/server';
export async function POST(req:Request){
 try{
  sameOrigin(req);
  const user=await getPortalUser();if(!user)throw new PortalError('Sign in with your verified administrator email first.',401);
  const admin=process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if(!admin)throw new PortalError('Set ADMIN_EMAIL to your sign-in email in Vercel’s Production environment and redeploy before initializing the database.',503);
  if(user.email!==admin)throw new PortalError('Only the configured administrator can initialize the database.',403);
  const client=getClient();
  await client.execute('CREATE TABLE IF NOT EXISTS _portal_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
  const prior=await client.execute({sql:'SELECT checksum FROM _portal_migrations WHERE name=?',args:[initialMigration.name]});
  if(prior.rows.length){if(prior.rows[0].checksum!==initialMigration.checksum)throw new PortalError('The database migration history differs from this app version. Contact the administrator.',409);return json({ready:true});}
  await client.batch([...initialMigration.statements,{sql:'INSERT INTO _portal_migrations(name,checksum) VALUES (?,?)',args:[initialMigration.name,initialMigration.checksum]}],'write');
  return json({ready:true});
 }catch(e){return failure(e);}
}
