import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return auth.handler(req, res);
}
