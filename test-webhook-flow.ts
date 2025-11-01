// Test script to verify webhook flow
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function testWebhookFlow() {
  console.log('Testing webhook flow...');
  
  // Simulate order.created event
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
  
  // Simulate subscription.active event
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
  
  console.log('Simulating order.created event...');
  console.log(JSON.stringify(orderCreatedEvent, null, 2));
  
  console.log('Simulating subscription.active event...');
  console.log(JSON.stringify(subscriptionActiveEvent, null, 2));
  
  console.log('Check Convex logs for processing results');
}

testWebhookFlow();
