import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { stageUpdateSchema } from "@/lib/validation/time";

/** Mark a payment stage reached (DUE) or undo it while it hasn't been invoiced. */
export default adminRoute({
  PUT: async (req, res) => {
    const id = queryId(req);
    const { status } = parseBody(stageUpdateSchema, req);
    const stage = await prisma.paymentStage.findUnique({ where: { id } });
    if (!stage) throw new HttpError(404, "Not found");
    if (stage.status === "INVOICED" || stage.status === "PAID") {
      throw new HttpError(409, "This stage has already been invoiced");
    }
    const updated = await prisma.paymentStage.update({
      where: { id },
      data: { status, reachedAt: status === "DUE" ? new Date() : null },
    });
    res.status(200).json({ stage: updated });
  },
});
