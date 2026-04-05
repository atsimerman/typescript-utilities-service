import { relations, sql } from "drizzle-orm";
import {
	boolean,
	date,
	foreignKey,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	role: text("role"),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
});

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),
	},
	(table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
	"verifications",
	{
		id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	users: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	users: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const currencies = pgTable("currencies", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	code: text("code").notNull().unique(), // PLN, EUR
	name: text("name").notNull(),
	symbol: text("symbol").notNull(),
	minorUnit: integer("minor_unit").notNull(), // 2 for PLN
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const countries = pgTable("countries", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	name: text("name").notNull(),
	iso: text("iso").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	label: text("label"),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	countryId: uuid("country_id")
		.notNull()
		.references(() => countries.id, { onDelete: "restrict" }),
	currencyId: uuid("currency_id")
		.notNull()
		.references(() => currencies.id, { onDelete: "restrict" }),
	zipCode: text("zip_code"),
	city: text("city"),
	street: text("street"),
	active: boolean("active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const services = pgTable(
	"services",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		parentId: uuid("parent_id"),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		type: text("type").notNull(), // 'group' | 'fixed' | 'metered'
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "custom_fk",
		}),
	],
);

export const addressServiceConfigs = pgTable(
	"address_service_configs",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		addressId: uuid("address_id")
			.notNull()
			.references(() => addresses.id, { onDelete: "cascade" }),
		serviceId: uuid("service_id")
			.notNull()
			.references(() => services.id, { onDelete: "restrict" }),
		fixedPrice: integer("fixed_price"), // minor units
		pricePerUnit: integer("price_per_unit"), // minor units
		activeFrom: date("active_from").notNull(),
		activeTo: date("active_to"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("address_service_version_unique").on(
			table.addressId,
			table.serviceId,
			table.activeFrom,
		),
		index("asc_address_idx").on(table.addressId),
	],
);

export const meters = pgTable(
	"meters",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		addressId: uuid("address_id")
			.notNull()
			.references(() => addresses.id, { onDelete: "cascade" }),
		serviceId: uuid("service_id")
			.notNull()
			.references(() => services.id, { onDelete: "restrict" }),
		name: text("name").notNull(),
		unit: text("unit").notNull(), // kWh, m3
		initialReading: integer("initial_reading").notNull().default(0),
		installedAt: date("installed_at").notNull(),
		removedAt: date("removed_at"),
		active: boolean("active").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("meter_address_idx").on(table.addressId),
		index("meter_service_idx").on(table.serviceId),
	],
);

export const meterReadings = pgTable(
	"meter_readings",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		meterId: uuid("meter_id")
			.notNull()
			.references(() => meters.id, { onDelete: "cascade" }),
		readingDate: date("reading_date").notNull(),
		value: integer("value").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("meter_date_unique").on(table.meterId, table.readingDate),
		index("meter_reading_meter_idx").on(table.meterId),
	],
);

export const ledgerEntries = pgTable(
	"ledger_entries",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		addressId: uuid("address_id")
			.notNull()
			.references(() => addresses.id, { onDelete: "cascade" }),
		serviceId: uuid("service_id").references(() => services.id, {
			onDelete: "restrict",
		}),
		meterId: uuid("meter_id").references(() => meters.id, {
			onDelete: "set null",
		}),
		period: date("period").notNull(), // first day of month
		entryType: text("entry_type").notNull(), // 'charge' | 'payment' | 'adjustment'
		quantity: integer("quantity"),
		unitPrice: integer("unit_price"),
		amount: integer("amount").notNull(), // minor units
		note: text("note"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("ledger_address_idx").on(table.addressId),
		index("ledger_period_idx").on(table.period),
		index("ledger_address_period_idx").on(table.addressId, table.period),
	],
);

export const meterReadingTemplates = pgTable("meter_reading_templates", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	addressId: uuid("address_id")
		.notNull()
		.references(() => addresses.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meterReadingTemplateLines = pgTable(
	"meter_reading_template_lines",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		templateId: uuid("template_id")
			.notNull()
			.references(() => meterReadingTemplates.id, { onDelete: "cascade" }),
		meterId: uuid("meter_id")
			.notNull()
			.references(() => meters.id, { onDelete: "restrict" }),
		sortOrder: integer("sort_order").default(0).notNull(),
	},
	(table) => [
		uniqueIndex("meter_template_line_unique").on(table.templateId, table.meterId),
		index("meter_template_line_template_idx").on(table.templateId),
	],
);

export const ledgerEntryTemplates = pgTable("ledger_entry_templates", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	addressId: uuid("address_id")
		.notNull()
		.references(() => addresses.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ledgerEntryTemplateLines = pgTable(
	"ledger_entry_template_lines",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		templateId: uuid("template_id")
			.notNull()
			.references(() => ledgerEntryTemplates.id, { onDelete: "cascade" }),
		entryType: text("entry_type").notNull(), // 'charge' | 'payment'
		serviceId: uuid("service_id").references(() => services.id, {
			onDelete: "restrict",
		}),
		sortOrder: integer("sort_order").default(0).notNull(),
	},
	(table) => [index("ledger_template_line_template_idx").on(table.templateId)],
);
