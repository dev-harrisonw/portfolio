import type { GetServerSidePropsContext } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { getClerkUser, isAdminUser } from "@/lib/access";

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
    const user = await getClerkUser(userId);
    if (!isAdminUser(user)) {
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
