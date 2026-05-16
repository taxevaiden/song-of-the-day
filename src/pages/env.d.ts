/// <reference types="astro/client" />

type Env = {
  SPOTIFY_API_HANDLER_CACHE: KVNamespace;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
};

type Runtime = import("@astrojs/cloudflare").Runtime<ENV>;
declare namespace App {
  interface Locals extends Runtime {}
}
