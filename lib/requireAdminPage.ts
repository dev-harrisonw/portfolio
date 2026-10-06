import type { GetServerSidePropsContext } from "next";
import { getClerkUser, isAdminUser, readAuth } from "@/lib/access";

export async function requireAdminPage(ctx: GetServerSidePropsContext) {
  const { userId } = readAuth(ctx.req);
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
