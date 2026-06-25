import { NextRequest, NextResponse } from "next/server";

const redirectMap: Record<string, string> = {
  "/teste": "/",
};

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const slug = pathname.replace(/^\/+/, "");
  const redirectTo = redirectMap[slug];

  if (!redirectTo) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(`/${redirectTo}`, request.url), 301);
}
