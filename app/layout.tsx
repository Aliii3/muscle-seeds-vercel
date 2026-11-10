import type {Metadata} from 'next';
import {ClerkProvider} from '@clerk/nextjs';
import './globals.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Muscle Seeds • Creator Portal',description:'Your code. Your impact. Paid sales insights for Muscle Seeds creators.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ClerkProvider>{children}</ClerkProvider></body></html>;}
