import { getRedesigns, saveRedesign, deleteRedesign, togglePin, checkRedesignLimit } from '../services/databaseService';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  const { action, userId, ...data } = req.body;

  if (!action || !userId) {
    return res.status(400).json({ error: 'Action and userId are required' });
  }

  try {
    switch (action) {
      case 'getHistory': {
        const redesigns = await getRedesigns(userId);
        const result = redesigns.map(redesign => ({
          id: redesign.id,
          designCatalog: redesign.designCatalog,
          styles: redesign.styles,
          climateZone: redesign.climateZone || '',
          timestamp: redesign.createdAt.getTime(),
          isPinned: redesign.isPinned,
          originalImageUrl: redesign.originalImageUrl,
          redesignedImageUrl: redesign.redesignedImageUrl
        }));
        res.status(200).json(result);
        break;
      }
      case 'saveHistoryItem': {
        const { originalImage, redesignedImage, catalog, styles, climateZone } = data;
        if (!originalImage || !redesignedImage || !catalog || !styles || !climateZone) {
          return res.status(400).json({ error: 'Missing required fields for saveHistoryItem' });
        }
        const result = await saveRedesign({
          originalImage,
          redesignedImage,
          catalog,
          styles,
          climateZone,
          userId
        });
        const sanitized = {
          id: result.id,
          designCatalog: result.designCatalog,
          styles: result.styles,
          climateZone: result.climateZone || '',
          timestamp: result.createdAt.getTime(),
          isPinned: result.isPinned,
          originalImageUrl: result.originalImageUrl,
          redesignedImageUrl: result.redesignedImageUrl
        };
        res.status(200).json(sanitized);
        break;
      }
      case 'deleteHistoryItem': {
        const { id } = data;
        if (!id) {
          return res.status(400).json({ error: 'id is required for deleteHistoryItem' });
        }
        await deleteRedesign(id);
        res.status(200).json({ success: true });
        break;
      }
      case 'togglePin': {
        const { id } = data;
        if (!id) {
          return res.status(400).json({ error: 'id is required for togglePin' });
        }
        await togglePin(id);
        const redesigns = await getRedesigns(userId);
        const result = redesigns.map(redesign => ({
          id: redesign.id,
          designCatalog: redesign.designCatalog,
          styles: redesign.styles,
          climateZone: redesign.climateZone || '',
          timestamp: redesign.createdAt.getTime(),
          isPinned: redesign.isPinned,
          originalImageUrl: redesign.originalImageUrl,
          redesignedImageUrl: redesign.redesignedImageUrl
        }));
        res.status(200).json(result);
        break;
      }
      case 'checkRedesignLimit': {
        const result = await checkRedesignLimit(userId);
        res.status(200).json(result);
        break;
      }
      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('History API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}