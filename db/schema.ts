import { pgTable, text, timestamp, boolean, json, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fingerprint: text('fingerprint').notNull().unique(),
  redesignCount: integer('redesign_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const landscapeRedesigns = pgTable('landscape_redesigns', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  originalImageUrl: text('original_image_url').notNull(),
  redesignedImageUrl: text('redesigned_image_url').notNull(),
  designCatalog: json('design_catalog').notNull(),
  styles: json('styles').notNull(),
  climateZone: text('climate_zone'),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
