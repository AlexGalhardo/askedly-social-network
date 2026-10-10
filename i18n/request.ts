import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from "./config";

// No language prefix in the URL: the language comes from the cookie (selector in the interface) or, on the first visit, from the browser.
export default getRequestConfig(async () => {
	const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
	const locale = isLocale(cookieLocale)
		? cookieLocale
		: localeFromAcceptLanguage((await headers()).get("accept-language"));

	return { locale, messages: (await import(`../messages/${locale}.ts`)).default };
});
