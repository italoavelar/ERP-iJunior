import { buildRuntime } from "./server.js";

// Vercel discovers this default Hono export. The module is reused within a
// warm Function instance, so PrismaClient is not recreated per request.
const runtime = buildRuntime();

export default runtime.app;
