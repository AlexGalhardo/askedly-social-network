# File uploads

[UploadThing](https://uploadthing.com) (`UPLOADTHING_TOKEN`) for uploading the user's avatar.

## Where it lives

- `app/api/uploadthing/route.ts` + `app/api/uploadthing/core.ts` — defines the `OurFileRouter` (allowed upload routes, size/type limits)
- `lib/uploadthing.ts` — exports `UploadButton`/`UploadDropzone` typed from the `OurFileRouter`, for use in the client components
- `lib/services/image-upload.service.ts` — business logic around the upload (e.g. updating the user's `avatar_url` after the upload completes)

## Flow

1. A client component uses `UploadButton`/`UploadDropzone` from `lib/uploadthing.ts`.
2. UploadThing processes the file and calls the `onUploadComplete` callback defined in `app/api/uploadthing/core.ts`.
3. The callback persists the new URL (`User.avatar_url`, which is `@unique` in the schema) through `image-upload.service.ts`.

## Adding a new upload route

Add the definition in `app/api/uploadthing/core.ts` (file type, maximum size, authentication middleware) — never accept an upload without validating the user's session in the route's middleware.
