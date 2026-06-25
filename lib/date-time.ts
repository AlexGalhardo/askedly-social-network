export class DateTime {
	private readonly date: Date;

	constructor(input: Date | string | number | null = null) {
		if (input === null) {
			this.date = new Date();
		} else if (input instanceof Date) {
			this.date = new Date(input);
		} else if (typeof input === "string") {
			this.date = this._parseStringDate(input);
		} else if (typeof input === "number") {
			this.date = new Date(input);
		} else {
			throw new Error("Formato de entrada inválido");
		}
	}

	private _parseStringDate(dateString: string): Date {
		dateString = dateString.trim();

		const brazilianDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
		const match = dateString.match(brazilianDateRegex);

		if (match) {
			const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
			return new Date(
				parseInt(year),
				parseInt(month) - 1,
				parseInt(day),
				parseInt(hour),
				parseInt(minute),
				parseInt(second),
			);
		}

		const parsedDate = new Date(dateString);
		if (isNaN(parsedDate.getTime())) {
			throw new Error("Formato de data inválido. Use dd/mm/yyyy ou dd/mm/yyyy hh:mm:ss");
		}
		return parsedDate;
	}

	formatarData(): string {
		const dia = this.date.getDate().toString().padStart(2, "0");
		const mes = (this.date.getMonth() + 1).toString().padStart(2, "0");
		const ano = this.date.getFullYear();
		return `${dia}/${mes}/${ano}`;
	}

	formatarHora(): string {
		const horas = this.date.getHours().toString().padStart(2, "0");
		const minutos = this.date.getMinutes().toString().padStart(2, "0");
		const segundos = this.date.getSeconds().toString().padStart(2, "0");
		return `${horas}:${minutos}:${segundos}`;
	}

	formatarCompleto(): string {
		return `${this.formatarData()} ${this.formatarHora()}`;
	}

	horaPorExtenso(): string {
		const horas = this.date.getHours();
		const minutos = this.date.getMinutes();
		const segundos = this.date.getSeconds();

		let resultado = `${horas} ${horas === 1 ? "hora" : "horas"}`;

		if (minutos > 0) {
			resultado += `, ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
		}

		if (segundos > 0) {
			resultado += ` e ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
		}

		return resultado;
	}

	dataPorExtenso(): string {
		const meses = [
			"janeiro",
			"fevereiro",
			"março",
			"abril",
			"maio",
			"junho",
			"julho",
			"agosto",
			"setembro",
			"outubro",
			"novembro",
			"dezembro",
		];

		const diasSemana = [
			"domingo",
			"segunda-feira",
			"terça-feira",
			"quarta-feira",
			"quinta-feira",
			"sexta-feira",
			"sábado",
		];

		const dia = this.date.getDate();
		const mes = meses[this.date.getMonth()];
		const ano = this.date.getFullYear();
		const diaSemana = diasSemana[this.date.getDay()];

		return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
	}

	timestamp(): number {
		return this.date.getTime();
	}

	timestampUnix(): number {
		return Math.floor(this.date.getTime() / 1000);
	}

	get dia(): number {
		return this.date.getDate();
	}

	get mes(): number {
		return this.date.getMonth() + 1;
	}

	get ano(): number {
		return this.date.getFullYear();
	}

	get horas(): number {
		return this.date.getHours();
	}

	get minutos(): number {
		return this.date.getMinutes();
	}

	get segundos(): number {
		return this.date.getSeconds();
	}

	get diaSemana(): string {
		const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
		return dias[this.date.getDay()];
	}

	get nomeMes(): string {
		const meses = [
			"janeiro",
			"fevereiro",
			"março",
			"abril",
			"maio",
			"junho",
			"julho",
			"agosto",
			"setembro",
			"outubro",
			"novembro",
			"dezembro",
		];
		return meses[this.date.getMonth()];
	}

	adicionarDias(dias: number): DateTime {
		const novaData = new Date(this.date);
		novaData.setDate(novaData.getDate() + dias);
		return new DateTime(novaData);
	}

	adicionarMeses(meses: number): DateTime {
		const novaData = new Date(this.date);
		novaData.setMonth(novaData.getMonth() + meses);
		return new DateTime(novaData);
	}

	adicionarAnos(anos: number): DateTime {
		const novaData = new Date(this.date);
		novaData.setFullYear(novaData.getFullYear() + anos);
		return new DateTime(novaData);
	}

	adicionarHoras(horas: number): DateTime {
		const novaData = new Date(this.date);
		novaData.setHours(novaData.getHours() + horas);
		return new DateTime(novaData);
	}

	adicionarMinutos(minutos: number): DateTime {
		const novaData = new Date(this.date);
		novaData.setMinutes(novaData.getMinutes() + minutos);
		return new DateTime(novaData);
	}

	adicionarSegundos(segundos: number): DateTime {
		const novaData = new Date(this.date);
		novaData.setSeconds(novaData.getSeconds() + segundos);
		return new DateTime(novaData);
	}

	diferencaEmDias(outraData: DateTime): number {
		const data1 = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
		const data2 = new Date(outraData.ano, outraData.mes - 1, outraData.dia);
		const diferenca = Math.abs(data2.getTime() - data1.getTime());
		return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
	}

	diferencaEmHoras(outraData: DateTime): number {
		const diferenca = Math.abs(outraData.timestamp() - this.timestamp());
		return Math.floor(diferenca / (1000 * 60 * 60));
	}

	diferencaEmMinutos(outraData: DateTime): number {
		const diferenca = Math.abs(outraData.timestamp() - this.timestamp());
		return Math.floor(diferenca / (1000 * 60));
	}

	ehAnterior(outraData: DateTime): boolean {
		return this.timestamp() < outraData.timestamp();
	}

	ehPosterior(outraData: DateTime): boolean {
		return this.timestamp() > outraData.timestamp();
	}

	ehIgual(outraData: DateTime): boolean {
		return this.formatarCompleto() === outraData.formatarCompleto();
	}

	ehMesmoDia(outraData: DateTime): boolean {
		return this.formatarData() === outraData.formatarData();
	}

	ehHoje(): boolean {
		const hoje = new DateTime();
		return this.ehMesmoDia(hoje);
	}

	ehOntem(): boolean {
		const ontem = new DateTime().adicionarDias(-1);
		return this.ehMesmoDia(ontem);
	}

	ehAmanha(): boolean {
		const amanha = new DateTime().adicionarDias(1);
		return this.ehMesmoDia(amanha);
	}

	ehFimDeSemana(): boolean {
		const dia = this.date.getDay();
		return dia === 0 || dia === 6;
	}

	ehAnoBissexto(): boolean {
		const ano = this.ano;
		return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
	}

	inicioDoMes(): DateTime {
		const novaData = new Date(this.date);
		novaData.setDate(1);
		novaData.setHours(0, 0, 0, 0);
		return new DateTime(novaData);
	}

	fimDoMes(): DateTime {
		const novaData = new Date(this.date);
		novaData.setMonth(novaData.getMonth() + 1, 0);
		novaData.setHours(23, 59, 59, 999);
		return new DateTime(novaData);
	}

	inicioDoDia(): DateTime {
		const novaData = new Date(this.date);
		novaData.setHours(0, 0, 0, 0);
		return new DateTime(novaData);
	}

	fimDoDia(): DateTime {
		const novaData = new Date(this.date);
		novaData.setHours(23, 59, 59, 999);
		return new DateTime(novaData);
	}

	formatarParaSQL(): string {
		return this.date.toISOString().slice(0, 19).replace("T", " ");
	}

	formatarParaInput(): string {
		const ano = this.date.getFullYear();
		const mes = (this.date.getMonth() + 1).toString().padStart(2, "0");
		const dia = this.date.getDate().toString().padStart(2, "0");
		return `${ano}-${mes}-${dia}`;
	}

	formatarTempo12h(): string {
		let horas = this.date.getHours();
		const minutos = this.date.getMinutes().toString().padStart(2, "0");
		const periodo = horas >= 12 ? "PM" : "AM";
		horas = horas % 12 || 12;
		return `${horas}:${minutos} ${periodo}`;
	}

	formatarRelativo(): string {
		const agora = new DateTime();
		const diferenca = agora.timestamp() - this.timestamp();
		const segundos = Math.floor(diferenca / 1000);
		const minutos = Math.floor(segundos / 60);
		const horas = Math.floor(minutos / 60);
		const dias = Math.floor(horas / 24);
		const meses = Math.floor(dias / 30);
		const anos = Math.floor(dias / 365);

		if (anos > 0) return `há ${anos} ${anos === 1 ? "ano" : "anos"}`;
		if (meses > 0) return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
		if (dias > 0) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
		if (horas > 0) return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
		if (minutos > 0) return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
		return "agora mesmo";
	}

	static agora(): DateTime {
		return new DateTime();
	}

	static hoje(): DateTime {
		return new DateTime().inicioDoDia();
	}

	static ontem(): DateTime {
		return new DateTime().adicionarDias(-1).inicioDoDia();
	}

	static amanha(): DateTime {
		return new DateTime().adicionarDias(1).inicioDoDia();
	}

	static criarData(
		dia: number,
		mes: number,
		ano: number,
		hora: number = 0,
		minuto: number = 0,
		segundo: number = 0,
	): DateTime {
		return new DateTime(new Date(ano, mes - 1, dia, hora, minuto, segundo));
	}

	static fromTimestamp(timestamp: number): DateTime {
		return new DateTime(new Date(timestamp));
	}

	static fromTimestampUnix(timestamp: number): DateTime {
		return new DateTime(new Date(timestamp * 1000));
	}

	toDate(): Date {
		return new Date(this.date);
	}

	toString(): string {
		return this.formatarCompleto();
	}

	toJSON(): object {
		return {
			timestamp: this.timestamp(),
			data: this.formatarData(),
			hora: this.formatarHora(),
			completo: this.formatarCompleto(),
			porExtenso: this.dataPorExtenso(),
		};
	}

	static logAgora(): string {
		return new DateTime().formatarCompleto();
	}
}
