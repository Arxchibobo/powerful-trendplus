/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SEMRUSH_API_KEY: string;
  readonly VITE_FB_ADS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
