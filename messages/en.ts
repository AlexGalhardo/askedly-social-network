import account from "./en/account.json";
import admin from "./en/admin.json";
import auth from "./en/auth.json";
import common from "./en/common.json";
import emails from "./en/emails.json";
import errors from "./en/errors.json";
import feed from "./en/feed.json";
import legal from "./en/legal.json";
import nav from "./en/nav.json";
import payments from "./en/payments.json";
import profile from "./en/profile.json";
import questions from "./en/questions.json";

const messages = { common, nav, auth, account, profile, questions, payments, feed, legal, errors, emails, admin };

export type Messages = typeof messages;

export default messages;
