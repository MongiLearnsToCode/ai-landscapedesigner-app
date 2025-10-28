import { Polar } from '@polar-sh/sdk';

// Debug logging for Polar configuration
console.log('🔍 Polar Configuration Debug:');
console.log('VITE_POLAR_ACCESS_TOKEN:', import.meta.env.VITE_POLAR_ACCESS_TOKEN ? 'Set (length: ' + import.meta.env.VITE_POLAR_ACCESS_TOKEN.length + ')' : 'NOT SET');
console.log('VITE_POLAR_SANDBOX:', import.meta.env.VITE_POLAR_SANDBOX);
console.log('VITE_POLAR_PRICE_PERSONAL_MONTHLY:', import.meta.env.VITE_POLAR_PRICE_PERSONAL_MONTHLY);

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
  console.log('🛒 Creating Polar checkout with config:', {
    productPriceId: config.productPriceId,
    successUrl: config.successUrl,
    hasMetadata: !!config.metadata,
    metadataKeys: config.metadata ? Object.keys(config.metadata) : [],
  });

  try {
    const checkoutLink = await polar.checkoutLinks.create({
      productPriceId: config.productPriceId,
      successUrl: config.successUrl,
      metadata: config.metadata,
      paymentProcessor: "stripe", // Required field
    });

    console.log('✅ Polar checkout created successfully:', {
      hasUrl: !!checkoutLink.url,
      urlLength: checkoutLink.url?.length,
    });

    return { url: checkoutLink.url };
  } catch (error) {
    console.error('❌ Polar checkout error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      body: error.body,
    });
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