// Shared utility for Polar pricing mappings
export function mapPolarPriceToPlan(priceId: string): string {
  const priceMap: Record<string, string> = {};

  // Only add entries for defined environment variables
  if (process.env.VITE_POLAR_PRICE_PERSONAL_MONTHLY) {
    priceMap[process.env.VITE_POLAR_PRICE_PERSONAL_MONTHLY] = 'Personal';
  }
  if (process.env.VITE_POLAR_PRICE_CREATOR_MONTHLY) {
    priceMap[process.env.VITE_POLAR_PRICE_CREATOR_MONTHLY] = 'Creator';
  }
  if (process.env.VITE_POLAR_PRICE_BUSINESS_MONTHLY) {
    priceMap[process.env.VITE_POLAR_PRICE_BUSINESS_MONTHLY] = 'Business';
  }
  if (process.env.VITE_POLAR_PRICE_PERSONAL_ANNUAL) {
    priceMap[process.env.VITE_POLAR_PRICE_PERSONAL_ANNUAL] = 'Personal';
  }
  if (process.env.VITE_POLAR_PRICE_CREATOR_ANNUAL) {
    priceMap[process.env.VITE_POLAR_PRICE_CREATOR_ANNUAL] = 'Creator';
  }
  if (process.env.VITE_POLAR_PRICE_BUSINESS_ANNUAL) {
    priceMap[process.env.VITE_POLAR_PRICE_BUSINESS_ANNUAL] = 'Business';
  }

  return priceMap[priceId] || 'Free';
}