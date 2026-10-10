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
			throw new Error("Invalid input format");
		}
	}

	private _parseStringDate(dateString: string): Date {
		dateString = dateString.trim();

		const brazilianDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
		const match = dateString.match(brazilianDateRegex);

		if (match) {
			const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
			return new Date(
				parseInt(year, 10),
				parseInt(month, 10) - 1,
				parseInt(day, 10),
				parseInt(hour, 10),
				parseInt(minute, 10),
				parseInt(second, 10),
			);
		}

		const parsedDate = new Date(dateString);
		if (Number.isNaN(parsedDate.getTime())) {
			throw new Error("Invalid date format. Use dd/mm/yyyy or dd/mm/yyyy hh:mm:ss");
		}
		return parsedDate;
	}

	formatDate(): string {
		const day = this.date.getDate().toString().padStart(2, "0");
		const month = (this.date.getMonth() + 1).toString().padStart(2, "0");
		const year = this.date.getFullYear();
		return `${day}/${month}/${year}`;
	}

	formatTime(): string {
		const hours = this.date.getHours().toString().padStart(2, "0");
		const minutes = this.date.getMinutes().toString().padStart(2, "0");
		const seconds = this.date.getSeconds().toString().padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	}

	formatFull(): string {
		return `${this.formatDate()} ${this.formatTime()}`;
	}

	timeInWords(locale: string = "en"): string {
		const formatUnit = (value: number, unit: "hour" | "minute" | "second"): string =>
			new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(value);

		const parts = [formatUnit(this.date.getHours(), "hour")];
		if (this.date.getMinutes() > 0) parts.push(formatUnit(this.date.getMinutes(), "minute"));
		if (this.date.getSeconds() > 0) parts.push(formatUnit(this.date.getSeconds(), "second"));

		return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts);
	}

	formatLongDate(locale: string = "en"): string {
		return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(this.date);
	}

	timestamp(): number {
		return this.date.getTime();
	}

	timestampUnix(): number {
		return Math.floor(this.date.getTime() / 1000);
	}

	get day(): number {
		return this.date.getDate();
	}

	get month(): number {
		return this.date.getMonth() + 1;
	}

	get year(): number {
		return this.date.getFullYear();
	}

	get hours(): number {
		return this.date.getHours();
	}

	get minutes(): number {
		return this.date.getMinutes();
	}

	get seconds(): number {
		return this.date.getSeconds();
	}

	weekdayName(locale: string = "en"): string {
		return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(this.date);
	}

	monthName(locale: string = "en"): string {
		return new Intl.DateTimeFormat(locale, { month: "long" }).format(this.date);
	}

	addDays(days: number): DateTime {
		const newDate = new Date(this.date);
		newDate.setDate(newDate.getDate() + days);
		return new DateTime(newDate);
	}

	addMonths(months: number): DateTime {
		const newDate = new Date(this.date);
		newDate.setMonth(newDate.getMonth() + months);
		return new DateTime(newDate);
	}

	addYears(years: number): DateTime {
		const newDate = new Date(this.date);
		newDate.setFullYear(newDate.getFullYear() + years);
		return new DateTime(newDate);
	}

	addHours(hours: number): DateTime {
		const newDate = new Date(this.date);
		newDate.setHours(newDate.getHours() + hours);
		return new DateTime(newDate);
	}

	addMinutes(minutes: number): DateTime {
		const newDate = new Date(this.date);
		newDate.setMinutes(newDate.getMinutes() + minutes);
		return new DateTime(newDate);
	}

	addSeconds(seconds: number): DateTime {
		const newDate = new Date(this.date);
		newDate.setSeconds(newDate.getSeconds() + seconds);
		return new DateTime(newDate);
	}

	diffInDays(other: DateTime): number {
		const date1 = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
		const date2 = new Date(other.year, other.month - 1, other.day);
		const diff = Math.abs(date2.getTime() - date1.getTime());
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}

	diffInHours(other: DateTime): number {
		const diff = Math.abs(other.timestamp() - this.timestamp());
		return Math.floor(diff / (1000 * 60 * 60));
	}

	diffInMinutes(other: DateTime): number {
		const diff = Math.abs(other.timestamp() - this.timestamp());
		return Math.floor(diff / (1000 * 60));
	}

	isBefore(other: DateTime): boolean {
		return this.timestamp() < other.timestamp();
	}

	isAfter(other: DateTime): boolean {
		return this.timestamp() > other.timestamp();
	}

	isEqual(other: DateTime): boolean {
		return this.formatFull() === other.formatFull();
	}

	isSameDay(other: DateTime): boolean {
		return this.formatDate() === other.formatDate();
	}

	isToday(): boolean {
		const today = new DateTime();
		return this.isSameDay(today);
	}

	isYesterday(): boolean {
		const yesterday = new DateTime().addDays(-1);
		return this.isSameDay(yesterday);
	}

	isTomorrow(): boolean {
		const tomorrow = new DateTime().addDays(1);
		return this.isSameDay(tomorrow);
	}

	isWeekend(): boolean {
		const day = this.date.getDay();
		return day === 0 || day === 6;
	}

	isLeapYear(): boolean {
		const year = this.year;
		return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
	}

	startOfMonth(): DateTime {
		const newDate = new Date(this.date);
		newDate.setDate(1);
		newDate.setHours(0, 0, 0, 0);
		return new DateTime(newDate);
	}

	endOfMonth(): DateTime {
		const newDate = new Date(this.date);
		newDate.setMonth(newDate.getMonth() + 1, 0);
		newDate.setHours(23, 59, 59, 999);
		return new DateTime(newDate);
	}

	startOfDay(): DateTime {
		const newDate = new Date(this.date);
		newDate.setHours(0, 0, 0, 0);
		return new DateTime(newDate);
	}

	endOfDay(): DateTime {
		const newDate = new Date(this.date);
		newDate.setHours(23, 59, 59, 999);
		return new DateTime(newDate);
	}

	formatForSQL(): string {
		return this.date.toISOString().slice(0, 19).replace("T", " ");
	}

	formatForInput(): string {
		const year = this.date.getFullYear();
		const month = (this.date.getMonth() + 1).toString().padStart(2, "0");
		const day = this.date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	formatTime12h(): string {
		let hours = this.date.getHours();
		const minutes = this.date.getMinutes().toString().padStart(2, "0");
		const period = hours >= 12 ? "PM" : "AM";
		hours = hours % 12 || 12;
		return `${hours}:${minutes} ${period}`;
	}

	formatRelative(locale: string = "en"): string {
		const now = new DateTime();
		const diff = now.timestamp() - this.timestamp();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const months = Math.floor(days / 30);
		const years = Math.floor(days / 365);

		const relative = new Intl.RelativeTimeFormat(locale);

		if (years > 0) return relative.format(-years, "year");
		if (months > 0) return relative.format(-months, "month");
		if (days > 0) return relative.format(-days, "day");
		if (hours > 0) return relative.format(-hours, "hour");
		if (minutes > 0) return relative.format(-minutes, "minute");
		// `numeric: "auto"` only at zero ("now"): for the rest it would become "yesterday" instead of "1 day ago".
		return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(0, "second");
	}

	static now(): DateTime {
		return new DateTime();
	}

	static today(): DateTime {
		return new DateTime().startOfDay();
	}

	static yesterday(): DateTime {
		return new DateTime().addDays(-1).startOfDay();
	}

	static tomorrow(): DateTime {
		return new DateTime().addDays(1).startOfDay();
	}

	static create(
		day: number,
		month: number,
		year: number,
		hour: number = 0,
		minute: number = 0,
		second: number = 0,
	): DateTime {
		return new DateTime(new Date(year, month - 1, day, hour, minute, second));
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
		return this.formatFull();
	}

	toJSON(): object {
		return {
			timestamp: this.timestamp(),
			date: this.formatDate(),
			time: this.formatTime(),
			full: this.formatFull(),
			longDate: this.formatLongDate(),
		};
	}

	static logNow(): string {
		return new DateTime().formatFull();
	}
}
