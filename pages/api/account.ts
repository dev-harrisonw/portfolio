import type { NextApiRequest, NextApiResponse } from "next";
import { getClerkUser, isAdminUser, readAuth } from "@/lib/access";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const { userId } = readAuth(req);
  if (!userId) {
    return res.status(200).json({ signedIn: false, isAdmin: false, hasPortal: false });
  }

  try {
    const [user, linked] = await Promise.all([
      getClerkUser(userId),
      prisma.clientUser.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
      }),
    ]);
    const isAdmin = isAdminUser(user);
    return res.status(200).json({
      signedIn: true,
      isAdmin,
      hasPortal: isAdmin || Boolean(linked),
    });
  } catch {
    return res.status(200).json({ signedIn: true, isAdmin: false, hasPortal: true });
  }
}
