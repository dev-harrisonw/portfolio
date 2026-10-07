import type { Appearance } from "@clerk/types";

const bg = "#141414";
const input = "#1F1F20";
const border = "#2a2a2c";
const text = "#DADBDD";
const muted = "#b2bbcf";
const primary = "#3BB143";
const white = "#ffffff";

/** Shared Clerk UI: dark like the rest of the site, Harrison branding, no vendor footer. */
export const clerkAppearance: Appearance = {
  layout: {
    logoImageUrl: "/static/logos/logo_no_text.svg",
    logoPlacement: "inside",
    shimmer: false,
  },
  variables: {
    colorPrimary: primary,
    colorBackground: bg,
    colorInputBackground: input,
    colorInputText: white,
    colorText: text,
    colorTextOnPrimaryBackground: white,
    colorTextSecondary: muted,
    colorNeutral: text,
    colorDanger: "#fb7185",
    borderRadius: "0.75rem",
    fontFamily: '"Be Vietnam Pro", Inter, system-ui, sans-serif',
  },
  elements: {
    rootBox: { colorScheme: "dark" },
    card: {
      backgroundColor: bg,
      border: `1px solid ${border}`,
      boxShadow: "none",
    },
    headerTitle: { color: white },
    headerSubtitle: { color: muted },
    socialButtonsBlockButton: {
      backgroundColor: input,
      border: `1px solid ${border}`,
      color: white,
    },
    dividerLine: { backgroundColor: border },
    dividerText: { color: muted },
    formFieldLabel: { color: text },
    formFieldInput: {
      backgroundColor: input,
      color: white,
      borderColor: border,
    },
    formButtonPrimary: {
      backgroundColor: primary,
      color: white,
    },
    footerActionText: { color: muted },
    footerActionLink: { color: primary },
    identityPreview: {
      backgroundColor: input,
      borderColor: border,
    },
    userButtonPopoverCard: {
      backgroundColor: bg,
      border: `1px solid ${border}`,
      boxShadow: "none",
    },
    userButtonPopoverActionButtonText: { color: text },
    userButtonPopoverFooter: { display: "none" },
    modalContent: { backgroundColor: bg },
    footer: { display: "none" },
    footerPages: { display: "none" },
    badge: { display: "none" },
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in",
      subtitle: "Use the email you were invited with.",
    },
  },
  signUp: {
    start: {
      title: "Create an account",
      subtitle: "You'll use this to open the client portal.",
    },
  },
};
