// worker/types.ts
export interface Env {
  // Storage bindings
  THERMALWISE_KV: KVNamespace;
  // Env
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  OPENAI_API_KEY: string;
  FIRECRAWL_API_KEY: string;
  UPLOADTHING_TOKEN: string;
  ENVIRONMENT: string;
}
