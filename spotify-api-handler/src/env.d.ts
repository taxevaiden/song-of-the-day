declare global {
	interface Env {
		SPOTIFY_API_HANDLER_CACHE: KVNamespace;
		SPOTIFY_CLIENT_ID: string;
		SPOTIFY_CLIENT_SECRET: string;
	}
}

export {};
