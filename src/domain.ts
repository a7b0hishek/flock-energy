import { z } from 'zod';

export const hierarchyLevelSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1)
});

export const geoSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

export const hierarchySchema = z.object({
  zone: hierarchyLevelSchema,
  circle: hierarchyLevelSchema,
  division: hierarchyLevelSchema,
  subdivision: hierarchyLevelSchema,
  substation: hierarchyLevelSchema,
  feeder: hierarchyLevelSchema,
  dt: hierarchyLevelSchema
});

export const meterSchema = z.object({
  meterId: z.string().min(1),
  serialNo: z.string().min(1),
  make: z.string().min(1),
  phaseType: z.enum(['single-phase', 'three-phase', 'unknown']),
  installStatus: z.enum(['active', 'inactive', 'pending']),
  installType: z.string().min(1),
  build: z.string().min(1),
  dtCode: z.string().min(1),
  hierarchy: hierarchySchema,
  geo: geoSchema
});

export type Meter = z.infer<typeof meterSchema>;

export const meterQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  make: z.string().trim().min(1).optional(),
  phaseType: z.enum(['single-phase', 'three-phase', 'unknown']).optional(),
  dtCode: z.string().trim().min(1).optional()
});

export type MeterQuery = z.infer<typeof meterQuerySchema>;

export const transformerSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  feeder: z.string().min(1),
  capacityKva: z.number().positive()
});

export type Transformer = z.infer<typeof transformerSchema>;

export const transformerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  feeder: z.string().trim().min(1).optional(),
  capacityKva: z.coerce.number().positive().optional()
});

export type TransformerQuery = z.infer<typeof transformerQuerySchema>;

export function parseMetersResponse(payload: unknown): Meter[] {
  const candidate = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : payload && typeof payload === 'object' && Array.isArray((payload as { meters?: unknown[] }).meters)
        ? (payload as { meters: unknown[] }).meters
        : null;

  if (candidate === null) {
    throw new Error('Portal response did not contain a usable meter list.');
  }

  return candidate.map((item) => meterSchema.parse(item));
}
