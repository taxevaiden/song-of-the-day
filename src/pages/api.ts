import type { APIRoute } from "astro";

export const prerender = false;

import { env } from "cloudflare:workers";

interface SpotifyTokenResponse {
  access_token: string;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyAPITrack[];
  };
}

interface SpotifyAPITrack {
  name: string;
  explicit: boolean;
  id: string;

  album: {
    name: string;
    images: { url: string }[];
  };

  artists: { name: string }[];
}

interface SpotifyTrack {
  coverURL: string;
  title: string;
  album: string;
  artist: string;
  explicit: boolean;
  id: string;
  day: number;
}

function shuffleArray(array: string[]) {
  const clone = structuredClone(array);

  for (let i = clone.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [clone[i], clone[j]] = [clone[j], clone[i]];
  }

  return clone;
}

const fetchSpotifyToken = async (): Promise<string> => {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

  const authString = `&client_id=${clientId}&client_secret=${clientSecret}`;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials${authString}`,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Spotify token");
  }

  const data = (await response.json()) as SpotifyTokenResponse;

  return data.access_token;
};

const getToday = (): { day: number } => {
  const today = new Date();

  const day =
    today.getUTCDay() +
    today.getUTCDate() +
    today.getUTCMonth() +
    (today.getUTCFullYear() - 1000) * 365;

  return { day };
};

const getRandomSearchQuery = (): {
  searchQuery: string;
} => {
  const searchQueries = [
    "tyler the creator",
    "brent faiyaz",
    "a$ap rocky",
    "daniel caesar",
    "frank ocean",
    "giveon",
    "kendrick lamar",
    "the weeknd",
    "steve lacy",
    "blood orange",
    "sza",
    "jorja smith",
    "ari lennox",
    "mahalia",
    "omar apollo",
    "snoh aalegra",
    "serpentwithfeet",
    "james blake",
    "thundercat",
    "j cole",
    "schoolboy q",
    "earl sweatshirt",
    "joey bada$$",
    "vince staples",
    "mf doom",
    "freddie gibbs",
    "denzel curry",
    "jpegmafia",
    "billy woods",
    "childish gambino",
    "anderson paak",
    "lucky daye",
    "bryson tiller",
    "partynextdoor",
    "syd",
    "lonr.",
  ];

  const shuffled = shuffleArray(searchQueries);

  return {
    searchQuery: shuffled[getToday().day % searchQueries.length],
  };
};

const fetchRandomTrack = async (): Promise<SpotifyTrack> => {
  const token = await fetchSpotifyToken();

  const day = getToday().day;

  const randomQuery = getRandomSearchQuery();

  const query = encodeURIComponent(randomQuery.searchQuery);

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Spotify API Error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as SpotifySearchResponse;

  if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
    throw new Error("No tracks found");
  }

  const track = data.tracks.items[day % data.tracks.items.length];

  return {
    coverURL: track.album.images[0]?.url ?? "",
    title: track.name,
    album: track.album.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    explicit: track.explicit,
    id: track.id,
    day,
  };
};

export const GET: APIRoute = async () => {
  const cache = env.SPOTIFY_API_HANDLER_CACHE;
  const cacheKey = "spotify-track";

  const cached = await cache.get(cacheKey, { type: "json" });

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const trackData = await fetchRandomTrack();

  await cache.put(cacheKey, JSON.stringify(trackData), {
    expirationTtl: 3600,
  });

  return new Response(JSON.stringify(trackData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
