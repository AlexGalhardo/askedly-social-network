import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from "./config";

// Sem prefixo de idioma na URL: o idioma vem do cookie (seletor na interface) ou, na primeira visita, do navegador.
export default getRequestConfig(async () => {
	const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
	const locale = isLocale(cookieLocale)
		? cookieLocale
		: localeFromAcceptLanguage((await headers()).get("accept-language"));

	return { locale, messages: (await import(`../messages/${locale}.ts`)).default };
});
