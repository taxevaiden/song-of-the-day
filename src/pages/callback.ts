import type { APIRoute } from "astro";

import { env } from "cloudflare:workers";

export const GET: APIRoute = async ({ request, redirect }) => {
  try {
    const reqUrl = new URL(request.url);
    const queryParams = reqUrl.searchParams;

    const code = queryParams.get("code");
    const error = queryParams.get("error");
    const state = queryParams.get("state");

    if (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }

    if (!state) {
      return Response.redirect(
        "/#" + new URLSearchParams({ error: "state_mismatch" }).toString(),
        302,
      );
    }

    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    const redirect_uri = env.SPOTIFY_REDIRECT_URI;

    const authHeader = btoa(
      `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
    );

    const body = new URLSearchParams({
      code,
      redirect_uri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
        )}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: env.SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return new Response(JSON.stringify(data), { status: 500 });
    }

    const sessionId = crypto.randomUUID();

    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    await env.SESSIONS.put(sessionId, JSON.stringify(session), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });

    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    );

    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    return new Response(`Error: ${(error as Error).message}`, {
      status: 500,
    });
  }
};
