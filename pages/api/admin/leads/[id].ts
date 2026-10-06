import prisma from "@/lib/prisma";
import { adminRoute, parseBody, queryId } from "@/lib/api";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).optional(),
  notes: z.string().max(5000).optional(),
});

export default adminRoute({
  PATCH: async (req, res) => {
    const id = queryId(req);
    const body = parseBody(patchSchema, req);
    if (body.status == null && body.notes == null) {
      return res.status(422).json({ error: "Nothing to update" });
    }
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes != null ? { notes: body.notes } : {}),
      },
    });
    res.status(200).json({ lead });
  },
});
