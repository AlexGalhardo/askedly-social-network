import { z } from "zod";

// Without this Zod 4 tests `new Function("")` to decide whether to use JIT. With the strict CSP (lib/csp.ts) the test fails
// (and it falls back to non-JIT mode), but the browser logs a CSP violation on every page that validates a form.
z.config({ jitless: true });

export { z };
