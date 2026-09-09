import type { GetServerSidePropsContext } from "next";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function requireAdminPage(ctx: GetServerSidePropsContext) {
  const { userId } = getAuth(ctx.req);
  if (!userId) {
    return {
      redirect: {
        destination: `/sign-in?redirect_url=${encodeURIComponent(
          ctx.resolvedUrl
        )}`,
        permanent: false,
      },
    };
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string } | undefined)?.role;
    const emails =
      process.env.ADMIN_EMAILS?.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean) || [];
    const userEmails = user.emailAddresses.map((e) =>
      e.emailAddress.toLowerCase()
    );
    const isAdmin =
      role === "admin" ||
      emails.some((email) => userEmails.includes(email));

    if (!isAdmin) {
      return {
        redirect: {
          destination: "/?error=forbidden",
          permanent: false,
        },
      };
    }

    return {
      props: {
        userId,
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: false,
      },
    };
  }
}
