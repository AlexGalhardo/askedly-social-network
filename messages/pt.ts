import type { Messages } from "./en";
import account from "./pt/account.json";
import admin from "./pt/admin.json";
import auth from "./pt/auth.json";
import common from "./pt/common.json";
import emails from "./pt/emails.json";
import errors from "./pt/errors.json";
import feed from "./pt/feed.json";
import legal from "./pt/legal.json";
import nav from "./pt/nav.json";
import payments from "./pt/payments.json";
import profile from "./pt/profile.json";
import questions from "./pt/questions.json";

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
