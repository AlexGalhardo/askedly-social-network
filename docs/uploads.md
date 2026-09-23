# Upload de Arquivos

[UploadThing](https://uploadthing.com) (`UPLOADTHING_TOKEN`) para upload de avatar de usuário.

## Onde está

- `app/api/uploadthing/route.ts` + `app/api/uploadthing/core.ts` — define o `OurFileRouter` (rotas de upload permitidas, limites de tamanho/tipo)
- `lib/uploadthing.ts` — exporta `UploadButton`/`UploadDropzone` tipados a partir do `OurFileRouter`, para uso nos componentes client
- `lib/services/image-upload.service.ts` — lógica de negócio ao redor do upload (ex: atualizar `avatar_url` do usuário após upload concluído)

## Fluxo

1. Componente client usa `UploadButton`/`UploadDropzone` de `lib/uploadthing.ts`.
2. UploadThing processa o arquivo e chama o callback `onUploadComplete` definido em `app/api/uploadthing/core.ts`.
3. O callback persiste a nova URL (`User.avatar_url`, que é `@unique` no schema) via `image-upload.service.ts`.

## Adicionando uma nova rota de upload

Adicionar a definição em `app/api/uploadthing/core.ts` (tipo de arquivo, tamanho máximo, middleware de autenticação) — nunca aceitar upload sem validar a sessão do usuário no middleware da rota.
