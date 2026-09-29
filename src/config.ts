import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATA_SOURCE: z.enum(['fixture', 'live']).default('fixture'),
  PORTAL_BASE_URL: z.string().url().default('https://urja-ops.flockenergy.tech'),
  PORTAL_SESSION_COOKIE: z.string().optional(),
  PORTAL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  APP_DEMO_USERNAME: z.string().min(1).default('demo@flock.energy'),
  APP_DEMO_PASSWORD: z.string().min(1).default('demo-password')
});

export const config = envSchema.parse(process.env);
