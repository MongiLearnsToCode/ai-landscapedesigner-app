import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN,
  server: import.meta.env.VITE_POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
});

export interface CheckoutConfig {
  productPriceId: string;
  successUrl: string;
  customerEmail?: string; // Not used in checkout link creation
  customerId?: string; // Not used in checkout link creation
  metadata?: Record<string, string>;
}

export const createCheckout = async (config: CheckoutConfig) => {
  try {
    const checkoutLink = await polar.checkoutLinks.create({
      productPriceId: config.productPriceId,
      successUrl: config.successUrl,
      metadata: config.metadata,
      paymentProcessor: "stripe", // Required field
    });

    return { url: checkoutLink.url };
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