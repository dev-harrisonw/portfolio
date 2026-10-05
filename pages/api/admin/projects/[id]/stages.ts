import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { PAYMENT_TERMS } from "@/lib/projects";
import { paymentTermsSchema } from "@/lib/validation/time";

/** Replace a fixed-price project's payment stages from a preset or a custom split. */
export default adminRoute({
  PUT: async (req, res) => {
    const projectId = queryId(req);
    const { terms, stages } = parseBody(paymentTermsSchema, req);

    const project = await prisma.project.findUnique({ where: { id: projectId }, include: { stages: true } });
    if (!project) throw new HttpError(404, "Project not found");
    if (project.billingType !== "FIXED") throw new HttpError(422, "Payment terms only apply to fixed-price projects");
    if (project.stages.some((s) => s.status !== "PENDING")) {
      throw new HttpError(409, "A stage has already been reached, so the terms can't be changed");
    }

    const next = terms === "CUSTOM" ? stages! : PAYMENT_TERMS[terms].stages;
    const updated = await prisma.$transaction(async (tx) => {
      await tx.paymentStage.deleteMany({ where: { projectId } });
      await tx.paymentStage.createMany({
        data: next.map((s, i) => ({ projectId, label: s.label, percent: s.percent, sortOrder: i })),
      });
      return tx.project.update({
        where: { id: projectId },
        data: { paymentTerms: terms },
        include: { stages: { orderBy: { sortOrder: "asc" } } },
      });
    });
    res.status(200).json({ project: updated });
  },
});
