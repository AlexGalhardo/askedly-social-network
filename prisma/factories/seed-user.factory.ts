import { faker } from "@faker-js/faker/locale/pt_BR";
import { hash } from "bcryptjs";
import slugify from "slugify";
import TelegramLog from "@/lib/telegram-logger";
import { SeedHelpers } from "../helpers/seed-helpers.helper";
import { SeedUserInterface } from "../helpers/seed-interfaces.helper";
import { SeedUniqueTracker } from "../helpers/seed-unique-tracker.helper";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidLatinName(name: string): boolean {
	return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(name);
}

const usedNicknames = new Set<string>();
const usedAvatars = new Set<string>();

export class SeedUserFactory {
	private toggleGender = false;

	constructor(private readonly uniqueTracker: SeedUniqueTracker) {}

	async createAdminUser(): Promise<Omit<SeedUserInterface, "id">> {
		return {
			is_admin: true,
			is_seed: true,
			name: "ADM",
			nickname: "admin",
			email: "admin@gmail.com",
			password: await hash("adminBR@123", 10),
			description: "",
			website: null,
			pix_key: null,
			avatar_url: null,
			twitter: null,
			instagram: null,
			youtube: null,
			tiktok: null,
			linkedin: null,
			github: null,
			facebook: null,
			twitch: null,
			api_key: SeedHelpers.generateApiKey(),
			privacy_accept_anonymous_questions: false,
			privacy_show_anonymous_questions_public: false,
			privacy_show_questions_answered_only_to_followers: false,
			privacy_show_value_received_from_answering_question: false,
			privacy_show_date_questions_was_answered: false,
			privacy_show_total_followers_public: false,
			privacy_show_total_questions_sent_public: false,
			privacy_show_likes_each_answer_public: false,
			privacy_show_dislikes_each_answer_public: false,
			privacy_show_total_likes_all_answers_public: false,
			privacy_show_total_questions_received_public: false,
			privacy_show_total_questions_answered_public: false,
		};
	}

	async createOfficialUser(): Promise<Omit<SeedUserInterface, "id">> {
		return {
			name: "RespondeAê Perfil Oficial",
			is_seed: true,
			nickname: "respondeae",
			email: "respondeae@gmail.com",
			password: await hash("respondeaeoficialBR@123", 10),
			description: "Perfil oficial do RespondeAe",
			website: faker.datatype.boolean() ? faker.internet.url() : null,
			pix_key: faker.datatype.boolean() ? faker.internet.email() : null,
			avatar_url: "https://jn8ro29yhv.ufs.sh/f/vHeKy2kb0BOP11yB1f902oNUJAhsEHWQqlITjdxySgXvfmct",
			twitter: null,
			instagram: "https://instagram.com/respondeaeoficial",
			youtube: null,
			tiktok: null,
			linkedin: null,
			github: null,
			facebook: null,
			twitch: null,
			api_key: SeedHelpers.generateApiKey(),
			privacy_accept_anonymous_questions: true,
			privacy_show_anonymous_questions_public: true,
			privacy_show_questions_answered_only_to_followers: true,
			privacy_show_value_received_from_answering_question: true,
			privacy_show_date_questions_was_answered: true,
			privacy_show_total_followers_public: true,
			privacy_show_total_questions_sent_public: true,
			privacy_show_likes_each_answer_public: true,
			privacy_show_dislikes_each_answer_public: true,
			privacy_show_total_likes_all_answers_public: true,
			privacy_show_total_questions_received_public: true,
			privacy_show_total_questions_answered_public: true,
		};
	}

	async createRandomUser(): Promise<Omit<SeedUserInterface, "id">> {
		let uniqueUser = null;

		while (!uniqueUser) {
			await sleep(200);

			const gender = this.toggleGender ? "male" : "female";
			this.toggleGender = !this.toggleGender;

			try {
				console.log(`🔄 Buscando usuário ${gender} na API...`);
				const res = await fetch(`https://randomuser.me/api/?nat=BR&gender=${gender}`);
				const data = await res.json();

				if (!data?.results || !Array.isArray(data.results) || data.results.length === 0) {
					console.warn("⚠️ Dados inválidos recebidos da API, tentando novamente...");
					continue;
				}

				const user = data.results[0];
				const name = `${user.name.first} ${user.name.last}`;

				if (!isValidLatinName(name)) {
					console.log(`❌ Nome inválido detectado: "${name}". Ignorando...`);
					continue;
				}

				let nickname = slugify(name, { lower: true, strict: true }).replace(/[-\s]/g, "");

				let attempts = 0;
				while (this.uniqueTracker.isNicknameUsed(nickname) && attempts < 10) {
					nickname += faker.number.int({ min: 1, max: 9999 });
					attempts++;
				}

				const email = `${nickname}@gmail.com`;
				const avatar_url = user.picture.large;

				if (
					!this.uniqueTracker.isEmailUsed(email) &&
					!usedNicknames.has(nickname) &&
					!usedAvatars.has(avatar_url)
				) {
					this.uniqueTracker.addNickname(nickname);
					this.uniqueTracker.addEmail(email);
					usedNicknames.add(nickname);
					usedAvatars.add(avatar_url);

					uniqueUser = {
						is_seed: true,
						name,
						nickname,
						email,
						password: await hash("senhaBR@123", 10),
						description: null,
						website: null,
						pix_key: `${nickname}@gmail.com`,
						avatar_url,
						twitter: SeedHelpers.generateSocialMediaUrl("twitter", nickname),
						instagram: SeedHelpers.generateSocialMediaUrl("instagram", nickname),
						youtube: SeedHelpers.generateSocialMediaUrl("youtube", nickname),
						tiktok: SeedHelpers.generateSocialMediaUrl("tiktok", nickname),
						linkedin: SeedHelpers.generateSocialMediaUrl("linkedin", nickname),
						github: SeedHelpers.generateSocialMediaUrl("github", nickname),
						facebook: SeedHelpers.generateSocialMediaUrl("facebook", nickname),
						twitch: SeedHelpers.generateSocialMediaUrl("twitch", nickname),
						api_key: SeedHelpers.generateApiKey(),
						privacy_accept_anonymous_questions: true,
						privacy_show_anonymous_questions_public: true,
						privacy_show_questions_answered_only_to_followers: true,
						privacy_show_value_received_from_answering_question: true,
						privacy_show_date_questions_was_answered: true,
						privacy_show_total_followers_public: true,
						privacy_show_total_questions_sent_public: true,
						privacy_show_likes_each_answer_public: true,
						privacy_show_dislikes_each_answer_public: true,
						privacy_show_total_likes_all_answers_public: true,
						privacy_show_total_questions_received_public: true,
						privacy_show_total_questions_answered_public: true,
						created_at: Math.random() < 0.75 ? faker.date.past() : faker.date.recent(),
						deleted_at: SeedHelpers.shouldDelete() ? faker.date.recent() : null,
						banned_until: SeedHelpers.shouldBan() ? faker.date.future() : null,
					};
					console.log(`✅ Usuário único gerado: ${name} (@${nickname})`);
				} else {
					console.log(`🔄 Usuário duplicado encontrado: nickname = ${nickname}, tentando novamente...`);
				}
			} catch (err: any) {
				TelegramLog.error(`Catch error seed-user.factory createRandomUser: ${err?.message}`);
				console.error("❌ Erro ao buscar ou processar dados da API:", err?.message);
			}
		}

		return uniqueUser!;
	}
}
