import { polarService } from '../services/polarService';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  const { action, productId, userEmail, successUrl } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  try {
    switch (action) {
      case 'createCheckoutSession': {
        if (!productId || !userEmail) {
          return res.status(400).json({ error: 'productId and userEmail are required' });
        }

        if (successUrl) {
          try {
            const url = new URL(successUrl);
            const allowedHosts = [process.env.VITE_APP_URL ? new URL(process.env.VITE_APP_URL).hostname : 'ai-landscapedesigner.com'];
            if (!allowedHosts.includes(url.hostname)) {
              return res.status(400).json({ error: 'Invalid successUrl' });
            }
          } catch {
            return res.status(400).json({ error: 'Malformed successUrl' });
          }
        }

        const checkoutSession = await polarService.createCheckoutSession(productId, userEmail, successUrl);
        res.status(200).json(checkoutSession);
        break;
      }
      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Polar API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}