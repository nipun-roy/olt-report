import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Reports Table: Stores generated reports so all reports stay in one place
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceBrand: text('source_brand').default('AUTO'),
  threshold: real('threshold').notNull().default(24.0),
  totalOnus: integer('total_onus').notNull().default(0),
  criticalCount: integer('critical_count').notNull().default(0),
  warningCount: integer('warning_count').notNull().default(0),
  optimalCount: integer('optimal_count').notNull().default(0),
  worstRxPower: real('worst_rx_power'),
  itemsJson: text('items_json').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Categories Table: For SMS / Snippets
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

// Quick SMS / Snippets Table with 3-language support (Bangla, Banglish, English)
export const snippets = sqliteTable('snippets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(), // Default fallback text
  contentBangla: text('content_bangla'), // পূর্ণাঙ্গ বাংলা (Full Bangla)
  contentBanglish: text('content_banglish'), // বাংলিশ (Banglish)
  contentEnglish: text('content_english'), // পূর্ণাঙ্গ ইংরেজি (Full English)
  categoryId: text('category_id'),
  categoryName: text('category_name'),
  tags: text('tags'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  copyCount: integer('copy_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const olts = sqliteTable('olts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull().default('BDCOM'),
  ipAddress: text('ip_address'),
  location: text('location'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  pppoeUsername: text('pppoe_username'),
  phone: text('phone'),
  address: text('address'),
  zone: text('zone'),
  package: text('package'),
  status: text('status').notNull().default('ACTIVE'),
  onuId: text('onu_id'),
  mac: text('mac'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const onus = sqliteTable('onus', {
  id: text('id').primaryKey(),
  oltId: text('olt_id'),
  onuId: text('onu_id').notNull(),
  port: text('port').notNull(),
  mac: text('mac').notNull(),
  description: text('description'),
  distance: text('distance'),
  rxPower: real('rx_power').notNull(),
  txPower: text('tx_power'),
  temp: text('temp'),
  voltage: text('voltage'),
  txBias: text('tx_bias'),
  status: text('status').notNull(),
  customerId: text('customer_id'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const signalLogs = sqliteTable('signal_logs', {
  id: text('id').primaryKey(),
  onuId: text('onu_id').notNull(),
  mac: text('mac').notNull(),
  rxPower: real('rx_power').notNull(),
  txPower: text('tx_power'),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
});

export const fieldTickets = sqliteTable('field_tickets', {
  id: text('id').primaryKey(),
  ticketNumber: text('ticket_number').notNull(),
  onuId: text('onu_id').notNull(),
  port: text('port'),
  mac: text('mac'),
  rxPower: real('rx_power').notNull(),
  customerName: text('customer_name'),
  phone: text('phone'),
  status: text('status').notNull().default('OPEN'),
  priority: text('priority').notNull().default('CRITICAL'),
  assignedTo: text('assigned_to'),
  issueNote: text('issue_note'),
  resolutionNote: text('resolution_note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
});

// Work Notes / Tasks Table (কাজের নোট ও টাস্ক ট্র্যাকার - কত সময় ধরে আছে ও সম্পন্ন ট্র্যাকিং)
export const workNotes = sqliteTable('work_notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('GENERAL'), // LINK_DOWN, POWER_OFF, FIBER_CUT, OPTICAL_LOSS, ROUTER_CONFIG, CUSTOMER_ISSUE, GENERAL
  priority: text('priority').notNull().default('HIGH'), // CRITICAL, HIGH, MEDIUM, LOW
  status: text('status').notNull().default('PENDING'), // PENDING, IN_PROGRESS, COMPLETED
  targetId: text('target_id'), // e.g. PON0/1:23, 10.10.1.5, User: Karim
  assignedTo: text('assigned_to'), // Technician or Team
  createdBy: text('created_by'), // Creator user name / email
  resolutionNote: text('resolution_note'), // Resolution remark when completed
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ==========================================
// Better Auth Core Tables (Authentication & Security)
// ==========================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});
