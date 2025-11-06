import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { polarWebhook } from "./polar";

const http = httpRouter();

// Test endpoint
const testEndpoint = httpAction(async (ctx, request) => {
  return new Response(JSON.stringify({ message: "HTTP router is working" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

http.route({
  path: "/test",
  method: "GET",
  handler: testEndpoint,
});

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: polarWebhook,
});

export default http;