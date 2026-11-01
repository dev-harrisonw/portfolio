import type { GetServerSidePropsContext } from "next";
import { getClerkUser, isAdminUser } from "@/lib/access";
import { applyAuthRedirect, resolveRequestAuth } from "@/lib/clerkRequest";

export async function requireAdminPage(ctx: GetServerSidePropsContext) {
  const auth = await resolveRequestAuth(ctx.req);
  const handshake = applyAuthRedirect(ctx.res, auth);
  if (handshake) return handshake;

  const { userId } = auth;
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
        destination: `/sign-in?redirect_url=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
}
