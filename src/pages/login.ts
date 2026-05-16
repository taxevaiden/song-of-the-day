import type { APIRoute } from "astro";
import queryString from "query-string";

import { env } from "cloudflare:workers";

const generateRandomString = (length: number): string => {
  let str = "";

  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  for (let i = 0; i < length; i++) {
    str += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return str;
};

export const GET: APIRoute = async ({ request, redirect }) => {
  try {
    const scope = "user-top-read";

    const reqUrl = new URL(request.url);

    const redirect_uri = env.SPOTIFY_REDIRECT_URI;

    const state = generateRandomString(16);

    const url =
      "https://accounts.spotify.com/authorize?" +
      queryString.stringify({
        response_type: "code",
        client_id: env.SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri,
        state,
      });

    return redirect(url, 307);
  } catch (error) {
    return new Response(`Error: ${(error as Error).message}`, {
      status: 500,
    });
  }
};
