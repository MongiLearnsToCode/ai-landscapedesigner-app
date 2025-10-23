import { Polar } from "@polar-sh/sdk";

let polar: Polar | null = null;
let initError: string | null = null;

if (!process.env.POLAR_ACCESS_TOKEN) {
  initError = 'POLAR_ACCESS_TOKEN environment variable is not set';
  console.error(initError);
} else {
  try {
    polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: "sandbox", // Use for testing - omit or use 'production' for live
    });
  } catch (error) {
    initError = `Failed to initialize Polar SDK: ${error}`;
    console.error(initError);
  }
}

export function getPolar(): Polar {
  if (!polar) {
    throw new Error(initError || 'Polar SDK not initialized');
  }
  return polar;
}