import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN,
  server: import.meta.env.VITE_POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
});

export interface CheckoutConfig {
  productPriceId: string;
  successUrl: string;
  customerEmail: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export const createCheckout = async (config: CheckoutConfig) => {
  try {
    const checkout = await polar.checkouts.create({
      products: [config.productPriceId], // Note: products is an array of product IDs, not price IDs
      successUrl: config.successUrl,
      customerEmail: config.customerEmail,
      customerId: config.customerId,
      customerMetadata: config.metadata,
    });

    return checkout;
  } catch (error) {
    console.error('Polar checkout error:', error);
    throw error;
  }
};

export const getCustomerPortalUrl = async (customerId: string) => {
  try {
    const session = await polar.customerSessions.create({
      customerId,
    });

    // Return the customer portal URL directly
    return session.customerPortalUrl;
  } catch (error) {
    console.error('Customer portal error:', error);
    throw error;
  }
};

export { polar };