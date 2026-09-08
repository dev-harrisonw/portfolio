export type Service = {
  id: string;
  title: string;
  blurb: string;
};

export const services: Service[] = [
  {
    id: "marketing-site",
    title: "Marketing / brochure site",
    blurb: "Clear pages, strong brand, easy to update—often WordPress.",
  },
  {
    id: "web-app",
    title: "Custom web app",
    blurb: "Bookings, dashboards, tools—built around your workflow.",
  },
  {
    id: "ecommerce",
    title: "Store / catalogue",
    blurb: "Product browsing and checkout-ready storefronts.",
  },
  {
    id: "other",
    title: "Something else",
    blurb: "Tell me what you need—I'll help shape it.",
  },
];

export const budgetBands = [
  "Under £1k",
  "£1k–£3k",
  "£3k–£8k",
  "£8k+",
  "Not sure yet",
];

export const timelines = [
  "ASAP",
  "Within a month",
  "1–3 months",
  "Flexible",
];
