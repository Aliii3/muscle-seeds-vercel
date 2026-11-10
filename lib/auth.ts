import 'server-only';
import {currentUser} from '@clerk/nextjs/server';
export async function getPortalUser(){
 let user;try{user=await currentUser();}catch{const error=new Error('Clerk identity lookup failed');error.name='ClerkIdentityError';throw error;}if(!user)return null;
 const primary=user.emailAddresses.find(e=>e.id===user.primaryEmailAddressId);
 // Only a verified email can claim an allowlisted creator or administrator account.
 if(!primary||primary.verification?.status!=='verified')return null;
 return {userId:user.id,email:primary.emailAddress.toLowerCase(),displayName:user.fullName||primary.emailAddress};
}
