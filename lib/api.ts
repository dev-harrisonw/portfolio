import type { NextApiRequest, NextApiResponse } from "next";
import { ZodError, type ZodSchema } from "zod";
import { requireAdmin } from "@/lib/auth";
import { HttpError } from "@/lib/http";

export { HttpError };

type Handler = (req: NextApiRequest, res: NextApiResponse, ctx: { userId: string }) => unknown | Promise<unknown>;
type MethodHandlers = Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", Handler>>;

/** Admin-only API route with per-method handlers and consistent error responses. */
export function adminRoute(handlers: MethodHandlers) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireAdmin(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const handler = handlers[req.method as keyof MethodHandlers];
    if (!handler) {
      res.setHeader("Allow", Object.keys(handlers));
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      await handler(req, res, { userId: auth.userId });
    } catch (error) {
      sendError(res, error);
    }
  };
}

export function sendError(res: NextApiResponse, error: unknown) {
  if (res.headersSent) return;
  if (error instanceof ZodError) {
    return res.status(422).json({ error: error.issues[0]?.message ?? "Invalid input", issues: error.issues });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  const code = (error as { code?: string })?.code;
  if (code === "P2025") return res.status(404).json({ error: "Not found" });
  if (code === "P2002") return res.status(409).json({ error: "Already exists" });
  if (code === "P2003") return res.status(409).json({ error: "Still referenced by other records" });
  console.error(error);
  return res.status(500).json({ error: "Something went wrong" });
}

export function parseBody<T>(schema: ZodSchema<T>, req: NextApiRequest): T {
  return schema.parse(req.body ?? {});
}

export function queryId(req: NextApiRequest, key = "id") {
  const value = req.query[key];
  if (typeof value !== "string" || !value) throw new HttpError(400, `${key} is required`);
  return value;
}
