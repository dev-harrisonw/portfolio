import type { NextApiRequest, NextApiResponse } from "next";
import { getClerkUser, isAdminUser, userHasPortal } from "@/lib/access";
import { applySetCookies, resolveRequestAuth } from "@/lib/clerkRequest";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const auth = await resolveRequestAuth(req);
  applySetCookies(res, auth.cookies);
  const { userId } = auth;
  if (!userId) {
    return res.status(200).json({ signedIn: false, isAdmin: false, hasPortal: false });
  }

  try {
    const [user, hasPortal] = await Promise.all([getClerkUser(userId), userHasPortal(userId)]);
    return res.status(200).json({
      signedIn: true,
      isAdmin: isAdminUser(user),
      hasPortal,
    });
  } catch {
    return res.status(200).json({ signedIn: true, isAdmin: false, hasPortal: true });
  }
}
