import { kebabCase } from "@/utils/utils";
import { Project } from "types";

const projects: Project[] = [
  {
    id: 8,
    title: "WeSharp",
    slug: "wesharp",
    desc: "End-to-end knife sharpening ops: public booking, customer portal, and an admin console with live dashboards.",
    overview:
      "WeSharp is a doorstep knife-sharpening product I designed and built for Greater Manchester and Liverpool kitchens — restaurants, hotels, butchers, and home cooks. The public site handles coverage, pricing, and collection bookings; signed-in kitchens get a portal for orders, blades, invoices, and programmes; staff get a full ops console.\n\nThe stack is a Next.js 15 app (TanStack Query, Recharts) talking to a Laravel 13 API with Stripe billing, knife tracking, route planning, CRM, and analytics. Dashboards cover customer overview, subscription allowances, workshop status, collections, finance, and an internal analytics/reporting suite (sales, routes, operations, cash, forecasts).",
    img: "/static/projects/wesharp/cover.jpg",
    link: "https://www.wesharp.co.uk/",
    tags: ["Next.js", "Laravel", "TypeScript", "PHP", "Stripe", "Tailwind", "Recharts"],
    status: "active",
    featured: true,
    year: 2026,
    highlights: [
      "Public booking flow with postcode coverage and a GBP price guide",
      "Customer portal: dashboard, bookings, knife register, orders, invoices, subscriptions",
      "Admin console: CRM, routes, work queue, finance, analytics, and executive reports",
      "Route-manager shell for drivers, with stop-level workshop status",
      "Stripe invoicing, VAT-ready PDFs, and programme allowance / overage",
      "Recharts analytics: revenue, knives sharpened, bookings, and route value",
    ],
    dashboards: [
      {
        src: "/static/projects/wesharp/dashboard.png",
        label: "Customer dashboard",
        caption: "Signed-in kitchen portal — next collection, live orders, unpaid invoices, and knives on file.",
      },
      {
        src: "/static/projects/wesharp/allowance.png",
        label: "Your plan",
        caption: "Active programme, renewal date, included collection visits, and knife allowance.",
      },
      {
        src: "/static/projects/wesharp/tracking.png",
        label: "Order tracking",
        caption: "Workshop status, related booking, invoice, and milestone updates on a live order.",
      },
      {
        src: "/static/projects/wesharp/knives.png",
        label: "Knife register",
        caption: "Every tagged blade with current workshop status across the account.",
      },
      {
        src: "/static/projects/wesharp/collections.png",
        label: "Collections",
        caption: "Booked pickups with live status, service type, and links into each visit.",
      },
      {
        src: "/static/projects/wesharp/invoices.png",
        label: "Invoices",
        caption: "Issued bills with totals, due dates, and payment status in GBP.",
      },
      {
        src: "/static/projects/wesharp/admin-dashboard.png",
        label: "Operations dashboard",
        caption: "Staff console — attention queue, weekly bookings, blades sharpened, and revenue.",
      },
      {
        src: "/static/projects/wesharp/admin-analytics.png",
        label: "Analytics",
        caption: "Internal KPIs for revenue, knives, outstanding balance, and new bookings.",
      },
    ],
    gallery: [
      {
        src: "/static/projects/wesharp/book.png",
        label: "Book a collection",
        caption: "Multi-step public enquiry — no account required to start.",
      },
      {
        src: "/static/projects/wesharp/pricing.png",
        label: "Pricing calculator",
        caption: "Guide rates in GBP for pay-as-you-go vs programmes.",
      },
      {
        src: "/static/projects/wesharp/trade.png",
        label: "Trade accounts",
        caption: "Business portal walkthroughs for ops, finance, and head office.",
      },
      {
        src: "/static/projects/wesharp/how.png",
        label: "How it works",
        caption: "Collect, sharpen, inspect, return — with portal updates.",
      },
      {
        src: "/static/projects/wesharp/subscriptions.png",
        label: "Programmes",
        caption: "Rolling routes, knife allowances, and overage in plain language.",
      },
    ],
    surfaces: [
      {
        name: "Public site",
        detail: "Marketing, coverage, pricing, subscriptions, trade, and the collection booking flow.",
      },
      {
        name: "Customer portal",
        detail: "Dashboard, bookings, orders, knives, invoices, locations, notifications, and programmes.",
      },
      {
        name: "Admin console",
        detail: "CRM, bookings, routes, work queue, knives, invoices, payments, finance, users, and CMS.",
      },
      {
        name: "Analytics",
        detail: "Overview KPIs plus sales, operations, route profitability, cash position, billing, and forecasts.",
      },
      {
        name: "Route manager",
        detail: "Mobile-first today’s run, stop detail, and offline-aware field shell.",
      },
    ],
  },
  {
    id: 0,
    title: "The Garm Plug",
    slug: "the-garm-plug",
    desc: "An all-in-one platform for sourcing, repairing, and reselling clothing.",
    overview:
      "The Garm Plug is a clothing reseller platform built to bring sourcing, repair, and resale into one branded storefront. The site leans into a bold streetwear identity while keeping browsing and checkout clear for customers.",
    img: "/static/projects/thegarmplug.jpg",
    link: "https://www.thegarmplug.com/",
    tags: ["WordPress", "PHP", "Tailwind", "JavaScript"],
    status: "active",
    featured: true,
    liveScreenshot: false,
    year: 2026,
  },
  {
    id: 1,
    title: "KeyGeni Group",
    slug: "keygeni-group",
    desc: "A professional, budget-conscious WordPress website built for a growing business.",
    overview:
      "KeyGeni Group needed a polished WordPress presence that still respected budget constraints. The build focuses on clear service messaging, fast pages, and an easy-to-maintain content setup for the team.",
    img: "/static/projects/kg.jpg",
    link: "https://www.keygeni.com/",
    tags: ["HTML", "CSS", "JavaScript", "WordPress"],
    status: "active",
    year: 2024,
  },
  {
    id: 2,
    title: "The Surveying Experts",
    slug: "the-surveying-experts",
    desc: "A streamlined WordPress site showcasing a full range of surveying services.",
    overview:
      "The Surveying Experts site organises a wide service catalogue into a simple WordPress experience. Visitors can understand offerings quickly and get in touch without fighting a cluttered layout.",
    img: "/static/projects/tse.jpg",
    link: "https://www.thesurveyingexperts.com",
    tags: ["HTML", "CSS", "JavaScript", "WordPress"],
    status: "active",
    year: 2024,
  },
  {
    id: 3,
    title: "Manchester Golf Club",
    slug: "manchester-golf-club",
    desc: "A custom booking system allowing members to easily reserve time slots.",
    overview:
      "A custom range booking system for Manchester Golf Club members. The app makes it straightforward to pick a slot, reduce admin overhead, and keep the booking flow reliable for regular users.",
    img: "/static/projects/mangc.jpg",
    link: "https://rangebooking.mangc.co.uk/",
    tags: ["HTML", "CSS", "JavaScript", "Python", "Django"],
    status: "active",
    year: 2023,
  },
  {
    id: 4,
    title: "MPJ Recruitment",
    slug: "mpj-recruitment",
    desc: "A robust ATS platform enabling candidates to browse and apply for jobs efficiently.",
    overview:
      "MPJ Recruitment’s ATS helps candidates discover roles and apply with less friction. The WordPress-based platform supports browsing, applications, and AI-assisted workflows for a busier recruitment pipeline.",
    img: "/static/projects/mpj.jpg",
    link: "https://www.mpjrecruitment.co.uk/",
    tags: ["HTML", "CSS", "JavaScript", "WordPress", "AI"],
    status: "active",
    featured: true,
    year: 2025,
  },
  {
    id: 5,
    title: "Athol Paints",
    slug: "athol-paints",
    desc: "A clean, catalogue-style website built for a paint manufacturer.",
    overview:
      "Athol Paints is a catalogue-style site for a paint manufacturer, built to showcase products clearly. The public codebase remains available for review as portfolio work from the original build.",
    img: "/static/projects/athol.png",
    link: "https://www.atholpaints.co.uk/",
    github: "https://github.com/dev-harrisonw/Athol",
    githubRepo: "dev-harrisonw/Athol",
    tags: ["HTML", "CSS", "JavaScript", "Bootstrap"],
    status: "active",
    year: 2022,
  },
  {
    id: 6,
    title: "AI Chatbot (v1.0)",
    slug: "ai-chatbot",
    desc: "A Python web application trained to handle FAQs and automate responses.",
    overview:
      "A Flask-based chatbot trained to answer FAQs and automate common responses. Built as an early exploration of conversational UI and simple AI-assisted support flows.",
    img: "/static/projects/ai-chatbot.png",
    github: "https://github.com/dev-harrisonw/Holiday-Chat-Agent",
    githubRepo: "dev-harrisonw/Holiday-Chat-Agent",
    tags: ["Python", "Flask", "AI"],
    status: "active",
    year: 2023,
  },
  {
    id: 7,
    title: "London Comedy Lunch",
    slug: "london-comedy-lunch",
    desc: "An event landing page providing key information and booking details for attendees.",
    overview:
      "London Comedy Lunch needed a focused event landing page for attendees—key details, atmosphere, and a clear path to enquire or book. The build keeps the experience light and on-brand for a recurring comedy event.",
    img: "/static/projects/lcl.png",
    link: "https://www.londoncomedylunch.com",
    github: "https://github.com/dev-harrisonw/LCL",
    githubRepo: "dev-harrisonw/LCL",
    tags: ["HTML", "CSS", "JavaScript", "jQuery", "Bootstrap"],
    status: "deprecated",
    statusNote:
      "I no longer manage this site. The live version may have changed since the original build.",
    featured: false,
    year: 2022,
    noindex: true,
  },
];

export const allTags: string[] = [];

projects.forEach((project) => {
  project.tags.forEach((tag) => !allTags.includes(tag) && allTags.push(tag));
});

export const allKebabTags = allTags.map((tag) => kebabCase(tag));

export const getProjectBySlug = (slug: string) =>
  projects.find((project) => project.slug === slug);

export const getSortedProjects = (list: Project[] = projects) =>
  [...list].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return a.featured ? -1 : 1;
    }
    return (b.year || 0) - (a.year || 0) || b.id - a.id;
  });

export const getFeaturedProjects = () =>
  getSortedProjects().filter((project) => project.featured);

export default projects;
