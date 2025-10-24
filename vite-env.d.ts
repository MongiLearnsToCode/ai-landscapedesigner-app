/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLAR_PRICE_PERSONAL_MONTHLY: string;
  readonly VITE_POLAR_PRICE_CREATOR_MONTHLY: string;
  readonly VITE_POLAR_PRICE_BUSINESS_MONTHLY: string;
  readonly VITE_POLAR_PRICE_PERSONAL_ANNUAL: string;
  readonly VITE_POLAR_PRICE_CREATOR_ANNUAL: string;
  readonly VITE_POLAR_PRICE_BUSINESS_ANNUAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}