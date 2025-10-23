import type { vaeEntityEnum } from '@/modules/drizzle/schema';

/**
 * VAE Entity type - re-exported from database schema
 * Based on official France VAE roles: https://vae.gouv.fr/
 */
export type VaeEntity = (typeof vaeEntityEnum.enumValues)[number];
