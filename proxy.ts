import {clerkMiddleware} from '@clerk/nextjs/server';
// Session validation and role authorization happen again inside every API handler.
export default clerkMiddleware();
export const config={matcher:['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)','/(api|trpc)(.*)']};
