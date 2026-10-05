import { adminRoute, HttpError } from "@/lib/api";
import { sendExport } from "@/lib/exports/handlers";

/** GET ?clientId=&period=YYYY-MM&format=csv|pdf */
export default adminRoute({
  GET: async (req, res) => {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : "";
    if (!clientId) throw new HttpError(400, "clientId is required");
    await sendExport(res, clientId, req.query.period, req.query.format);
  },
});
