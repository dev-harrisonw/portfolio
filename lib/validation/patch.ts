import { z } from "zod";

type WithoutDefault<S> = S extends z.ZodDefault<infer Inner> ? Inner : S;

/**
 * The schema for a PATCH body: every field optional, defaults removed.
 *
 * `schema.partial()` is not enough on zod 4: it still applies `.default()` values to missing keys, so a
 * body of `{ name }` would also reset `billOverages`, `status` and the rest to their defaults.
 */
export function patchSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    const inner = field instanceof z.ZodDefault ? (field.removeDefault() as z.ZodType) : (field as z.ZodType);
    shape[key] = inner.optional();
  }
  return z.object(shape) as unknown as z.ZodObject<{ [K in keyof T]: z.ZodOptional<WithoutDefault<T[K]> & z.ZodType> }>;
}
