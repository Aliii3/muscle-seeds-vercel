import {SignIn} from '@clerk/nextjs';
export default function SignInPage(){return <main className="auth-page"><div className="auth-brand">MUSCLE SEEDS<small>CREATOR PORTAL</small></div><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up"/><p>Sign in with the email Muscle Seeds assigned to your creator account.</p></main>;}
