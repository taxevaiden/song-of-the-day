/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "ui-system", "sans-serif"],
            },

            colors: {
                primary: "rgba(10,10,10,0.5)",
                border: "rgba(0,0,0,0.05)",

                text: "rgb(255,255,255)",
                "text-secondary": "rgb(200,200,200)",
            },

            boxShadow: {
                d: [
                    "inset 0px 0px 64px rgba(0,0,0,0.05)",
                    "inset 0px 4px 8px -2px rgba(255,255,255,0.05)",
                    "inset 0px -4px 8px -2px rgba(0,0,0,0.05)",
                    "0 25px 50px -12px rgb(0 0 0 / 0.5)",
                ],
            },

            animation: {
                scrollTitle: "scrollTitle 7.5s linear infinite", // Custom animation
            },
            keyframes: {
                scrollTitle: {
                    "0%": { transform: "translateX(0%)" },
                    "25%": { transform: "translateX(-50%)" },
					"50%": { transform: "translateX(-50%)" },
					"75%": { transform: "translateX(0%)" },
					"100%": { transform: "translateX(0%)" },
                },
            },
        },
    },
    plugins: [],
};
