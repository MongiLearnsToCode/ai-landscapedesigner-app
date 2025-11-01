// Test script to verify webhook flow by POSTing to webhook endpoint

const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error('VITE_CONVEX_URL is required');
  process.exit(1);
}

async function testWebhookFlow() {
  console.log('Testing webhook flow...');
  
  const webhookUrl = `${convexUrl}/polar-webhook`;
  
  // Test order.created event
  const orderCreatedEvent = {
    type: 'order.created',
    data: {
      id: 'test_order_123',
      customerId: 'test_customer_123',
      customer: {
        id: 'test_customer_123',
        metadata: {
          clerk_user_id: 'user_test123'
        }
      }
    }
  };
  
  // Test subscription.active event
  const subscriptionActiveEvent = {
    type: 'subscription.active',
    data: {
      id: 'test_sub_123',
      customerId: 'test_customer_123',
      status: 'active',
      product: {
        name: 'Personal'
      },
      prices: [{
        id: 'price_123',
        recurringInterval: 'month'
      }],
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
  
  console.log('Testing order.created event...');
  const orderResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderCreatedEvent)
  });
  console.log(`Order event response: ${orderResponse.status}`);
  
  console.log('Testing subscription.active event...');
  const subscriptionResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriptionActiveEvent)
  });
  console.log(`Subscription event response: ${subscriptionResponse.status}`);
  
  if (orderResponse.status === 200 && subscriptionResponse.status === 200) {
    console.log('✅ Both webhook events processed successfully');
  } else {
    console.log('❌ Some webhook events failed');
  }
}

testWebhookFlow();
