// Secrets are set with `wrangler secret put` and never appear in config,
// so `wrangler types` cannot see them; they are declared here instead.
export {};

declare global {
  interface Env {
    TURNSTILE_SECRET_KEY?: string;
    GITHUB_TOKEN?: string;
  }
}
