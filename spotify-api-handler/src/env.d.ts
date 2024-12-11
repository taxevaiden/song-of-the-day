// Define custom types for environment variables/services
declare global {
	// Extend the Env interface if you're using something like Cloudflare Workers
	interface Env {
		SPOTIFY_API_HANDLER_CACHE: KVNamespace; // Adjust the type if necessary, e.g., KVNamespace
		SPOTIFY_CLIENT_ID: string;
		SPOTIFY_CLIENT_SECRET: string;
		// Other environment variables or services can be added here
	}
}

export {}; // This ensures the declaration is treated as a module
