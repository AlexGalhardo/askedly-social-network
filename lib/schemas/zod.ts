import { z } from "zod";

// Sem isto o Zod 4 testa `new Function("")` para decidir se usa JIT. Com o CSP estrito (lib/csp.ts) o teste falha
// (e ele cai no modo sem JIT), mas o browser registra uma violação de CSP a cada página que valida formulário.
z.config({ jitless: true });

export { z };
