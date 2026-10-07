import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * Runs the Vercel Functions in api/ inside `npm run dev`, so local signing works the same way
 * it does on Vercel. Server-only env (like SIGNER_KEY) is read from .env here and never reaches
 * the browser: only VITE_* variables are put in the app bundle.
 */
const vercelFunctions = (env) => ({
    name: "vercel-functions",
    configureServer(server) {
        Object.entries(env).forEach(([ k, v ]) => {
            if (process.env[k] === undefined) process.env[k] = v;
        });
        server.middlewares.use(async (req, res, next) => {
            const match = req.url?.match(/^\/api\/([a-z0-9-]+)/i);
            if (!match) return next();
            try {
                const mod = await server.ssrLoadModule(`/api/${match[1]}.js`);
                await mod.default(req, res);
            } catch (error) {
                console.error(error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Function failed" }));
            }
        });
    },
});

export default defineConfig(({ mode }) => ({
    plugins: [ tailwindcss(), vercelFunctions(loadEnv(mode, process.cwd(), "")) ],
    build: { target: "es2022" },
}));
