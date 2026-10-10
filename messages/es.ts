import type { Messages } from "./en";
import account from "./es/account.json";
import admin from "./es/admin.json";
import auth from "./es/auth.json";
import common from "./es/common.json";
import emails from "./es/emails.json";
import errors from "./es/errors.json";
import feed from "./es/feed.json";
import legal from "./es/legal.json";
import nav from "./es/nav.json";
import payments from "./es/payments.json";
import profile from "./es/profile.json";
import questions from "./es/questions.json";

const messages: Messages = {
	common,
	nav,
	auth,
	account,
	profile,
	questions,
	payments,
	feed,
	legal,
	errors,
	emails,
	admin,
};

export default messages;
