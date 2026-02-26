/**
 * Zod validation schemas for all public and admin API endpoints.
 * Centralised here so they can be reused across routes and actions.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Leads — Valuation form
// ---------------------------------------------------------------------------
export const valuationPropertySchema = z.object({
  direccion: z.string().min(1).max(500),
  referenciaCatastral: z.string().min(14).max(20),
  superficie: z.union([z.string(), z.number()]).optional(),
  anoConstruccion: z.union([z.string(), z.number(), z.null()]).optional(),
  uso: z.string().max(100).optional().default(''),
  habitaciones: z.union([z.string(), z.number()]).optional(),
  banos: z.union([z.string(), z.number()]).optional(),
  aseos: z.union([z.string(), z.number()]).optional(),
  terraza: z.boolean().optional(),
  terrazaM2: z.union([z.string(), z.number()]).optional(),
  reformado: z.boolean().optional(),
  anoReforma: z.union([z.string(), z.number(), z.null()]).optional(),
  ascensor: z.boolean().optional(),
  piscina: z.boolean().optional(),
  jardin: z.boolean().optional(),
});

export const valuationContactSchema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email().max(320),
  telefono: z.string().min(6).max(30),
  mensaje: z.string().max(2000).optional().default(''),
});

export const valuationEstimationSchema = z.object({
  min: z.number(),
  max: z.number(),
}).nullable().optional();

export const valuationAddressSchema = z.object({
  municipio: z.string().max(200).optional(),
  provincia: z.string().max(200).optional(),
}).optional();

export const valuationBodySchema = z.object({
  property: valuationPropertySchema,
  contactData: valuationContactSchema,
  estimation: valuationEstimationSchema,
  address: valuationAddressSchema,
});

// ---------------------------------------------------------------------------
// Catastro — Search
// ---------------------------------------------------------------------------
export const catastroSearchSchema = z.object({
  provincia: z.string().max(100).optional(),
  municipio: z.string().max(100).optional(),
  via: z.string().max(300).optional(),
  numero: z.string().max(20).optional(),
  tipoVia: z.string().max(10).optional(),
  rc: z.string().min(14).max(20).optional(),
}).refine(
  (data) => data.rc || (data.provincia && data.municipio && data.via && data.numero),
  { message: 'Debe proporcionar rc o (provincia + municipio + via + numero)' }
);

// ---------------------------------------------------------------------------
// Admin — Translations
// ---------------------------------------------------------------------------
export const translationsSaveSchema = z.object({
  propertyId: z.number().int().positive(),
  translations: z.record(z.string(), z.string().max(10000)),
});

export const translationsRunSchema = z.object({
  property_ids: z.array(z.number().int().positive()).min(1).max(200).optional(),
  batch_size: z.number().int().min(1).max(50).optional(),
});

export const translationsBlogSchema = z.object({
  postIds: z.array(z.union([z.number().int().positive(), z.string().min(1)])).min(1).max(100).optional(),
});

// ---------------------------------------------------------------------------
// Admin — Sync incremental
// ---------------------------------------------------------------------------
export const syncIncrementalSchema = z.object({
  batchSize: z.number().int().min(1).max(100).optional(),
});
