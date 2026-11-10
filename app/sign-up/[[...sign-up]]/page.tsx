import {SignUp} from '@clerk/nextjs';
export default function SignUpPage(){return <main className="auth-page"><div className="auth-brand">MUSCLE SEEDS<small>CREATOR PORTAL</small></div><SignUp routing="path" path="/sign-up" signInUrl="/sign-in"/><p>Creating a login does not grant access. Muscle Seeds must add your email to the creator directory.</p></main>;}
