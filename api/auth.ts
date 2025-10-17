import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract the auth path from the URL
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const authPath = url.pathname.replace('/api/auth', '');
  
  // Create a new request with the correct path for Better Auth
  const modifiedReq = {
    ...req,
    url: authPath || '/',
  };

  return auth.handler(modifiedReq, res);
}
