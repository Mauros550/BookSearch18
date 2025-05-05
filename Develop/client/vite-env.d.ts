/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GRAPHQL_ENDPOINT: string;
    // add more env vars here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  