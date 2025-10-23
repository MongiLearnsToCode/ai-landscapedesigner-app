import { Polar } from "@polar-sh/sdk";

let polar: any = null;
try {
  polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox", // Use for testing - omit or use 'production' for live
  });
} catch (error) {
  console.error('Failed to initialize Polar SDK:', error);
}

export { polar };