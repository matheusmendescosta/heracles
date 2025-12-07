import z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'production', 'test']).default('dev'),
  API_PORT: z.coerce.number().default(3333),
  PRISMA_STUDIO_PORT: z.coerce.number().default(5555),
  POSGRESDB_VOLUME_PATH: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  PGADMIN_DEFAULT_EMAIL: z.string().email(),
  PGADMIN_DEFAULT_PASSWORD: z.string(),
  PGADMIN_LISTEN_PORT: z.coerce.number().default(8082),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
});

export type Env = z.infer<typeof envSchema>;
