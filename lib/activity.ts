import prisma from "@/lib/prisma";

export type ActivityInput = {
  type: string;
  message: string;
  href?: string | null;
  clientId?: string | null;
};

export async function logActivity(entry: ActivityInput) {
  try {
    await prisma.activity.create({
      data: {
        type: entry.type,
        message: entry.message,
        href: entry.href ?? null,
        clientId: entry.clientId ?? null,
      },
    });
  } catch (error) {
    console.error("activity log failed", error);
  }
}

export function listActivity(take = 12) {
  return prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { client: { select: { id: true, name: true } } },
  });
}
