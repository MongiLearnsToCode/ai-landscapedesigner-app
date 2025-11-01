// Shared constants for subscription plans and limits

export const PLAN_LIMITS: Record<string, { plan: string; limit: number }> = {
  Personal: { plan: 'Personal', limit: 50 },
  Creator: { plan: 'Creator', limit: 200 },
  Business: { plan: 'Business', limit: 999999 },
};
