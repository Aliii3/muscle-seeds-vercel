export type SafeFailure={error:string;code:string;status:number};
export function setupFailure(error:unknown):SafeFailure {
 const chain:string[]=[];let item:unknown=error;
 for(let i=0;i<5&&item;i++){
  if(item instanceof Error){chain.push(item.name,item.message);item=item.cause;}
  else {chain.push(String(item));break;}
 }
 const text=chain.join(' ');
 if(/TURSO_DATABASE_URL/.test(text))return {error:'The database connection is not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to this project’s Production environment in Vercel, then redeploy.',code:'DATABASE_NOT_CONFIGURED',status:503};
 if(/no such table|SQLITE_ERROR.*(?:settings|creators|orders)/i.test(text))return {error:'The database is connected, but the portal tables have not been created. Sign in as the configured administrator and initialize the database below.',code:'DATABASE_SCHEMA_MISSING',status:503};
 if(/ClerkIdentityError/.test(text))return {error:'The login service could not read your account. Check that CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY belong to the same Clerk application and environment, then redeploy.',code:'LOGIN_SERVICE_ERROR',status:503};
 if(/libsql|turso|unauthorized|AUTH_FAILED|URL_INVALID|SERVER_ERROR|CONNECT_TIMEOUT|fetch failed|ENOTFOUND/i.test(text))return {error:'The portal could not connect to its database. Check the Turso URL and auth token in Vercel’s Production environment, then redeploy.',code:'DATABASE_CONNECTION_ERROR',status:503};
 return {error:'Your workspace could not load. Check the /api/portal error in Vercel’s runtime logs, then retry.',code:'WORKSPACE_UNAVAILABLE',status:500};
}
