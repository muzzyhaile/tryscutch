import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Security headers plugin for production builds
function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    apply: 'build',
    transformIndexHtml(html) {
      // Add CSP meta tag for production as a fallback.
      // IMPORTANT:
      // - `frame-ancestors` is ignored in <meta> CSP (must be an HTTP header)
      // - `X-Frame-Options`/`X-Content-Type-Options`/`Permissions-Policy` must be HTTP headers
      // We set those via `_headers` (prod) and `server.headers` (dev).
      const cspContent = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for Vite's module scripts
        "style-src 'self' 'unsafe-inline'", // Fonts are self-hosted, no external CDN needed
        "font-src 'self'", // All fonts served from same origin
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; ');

      return html.replace(
        '<meta name="viewport"',
        `<meta http-equiv="Content-Security-Policy" content="${cspContent}">\n    <meta name="referrer" content="strict-origin-when-cross-origin">\n    <meta name="viewport"`
      );
    }
  };
}

// Environment variable injection plugin
function envInjectionPlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'env-injection',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Replace env placeholders with actual values at build time
        const supabaseUrl = env.VITE_SUPABASE_URL || '';
        const supabaseKey =
          env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';

        return html
          .replace('%VITE_SUPABASE_URL%', supabaseUrl)
          .replace('%VITE_SUPABASE_PUBLISHABLE_KEY%', supabaseKey);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
    const loaded = loadEnv(mode, process.cwd(), '');
    const env: Record<string, string | undefined> = {
      ...loaded,
      ...process.env,
    };
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Security headers for development server
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
          // CSP for development (more permissive for HMR)
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Vite HMR
            "style-src 'self' 'unsafe-inline'", // Self-hosted fonts
            "font-src 'self'", // All fonts served from same origin
            "img-src 'self' data: https:",
            "connect-src 'self' ws: wss: https://*.supabase.co https://generativelanguage.googleapis.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        }
      },
      plugins: [react(), envInjectionPlugin(env), securityHeadersPlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
