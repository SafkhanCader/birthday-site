/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_MOCK_PASSWORD?: string;
  readonly VITE_MOCK_LOCKED?: string;
  readonly VITE_MOCK_GUEST_CODE?: string;
  readonly VITE_MOCK_VOICE_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
