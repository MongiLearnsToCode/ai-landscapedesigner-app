import type { HydratedHistoryItem } from '../../types';

// Type for the redesign document returned by Convex
export interface ConvexRedesign {
  _id: string;
  _creationTime: number;
  clerkUserId: string;
  redesignId: string;
  originalImageUrl: string;
  redesignedImageUrl: string;
  designCatalog: any;
  styles: any;
  climateZone?: string;
  isPinned?: boolean;
  createdAt?: number;
}

/**
 * Process Convex history data into HydratedHistoryItem format
 * Handles timestamp parsing with validation and sorting by pin status then timestamp
 */
export function processConvexHistory(convexHistory: ConvexRedesign[] | undefined): HydratedHistoryItem[] {
  if (!convexHistory) return [];

  return convexHistory.map(redesign => {
    let timestamp: number | null = null;

    if (typeof redesign.createdAt === 'number' && Number.isFinite(redesign.createdAt)) {
      timestamp = redesign.createdAt;
    } else {
      const parsedTime = new Date(redesign.createdAt || redesign._creationTime).getTime();
      if (Number.isFinite(parsedTime)) {
        timestamp = parsedTime;
      } else {
        console.warn(`Invalid timestamp for redesign ${redesign.redesignId}: createdAt=${redesign.createdAt}, _creationTime=${redesign._creationTime}`);
      }
    }

    return {
      id: redesign.redesignId,
      designCatalog: redesign.designCatalog,
      styles: redesign.styles,
      climateZone: redesign.climateZone || '',
      timestamp,
      isPinned: redesign.isPinned || false,
      originalImageUrl: redesign.originalImageUrl,
      redesignedImageUrl: redesign.redesignedImageUrl
    };
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Treat null timestamps as newest (appear first)
    if (a.timestamp === null && b.timestamp !== null) return -1;
    if (b.timestamp === null && a.timestamp !== null) return 1;

    // Both null or both have timestamps - sort by timestamp descending
    if (a.timestamp === null && b.timestamp === null) return 0;
    return (b.timestamp as number) - (a.timestamp as number);
  });
}