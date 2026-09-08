import { kebabCase } from "@/utils/utils";
import { Project } from "types";

const projects: Project[] = [
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
    status: "active",
    featured: true,
    year: 2022,
  },
];

export const allTags = [];

projects.forEach((project) => {
  project.tags.forEach((tag) => !allTags.includes(tag) && allTags.push(tag));
});

export const allKebabTags = allTags.map((tag) => kebabCase(tag));

export const getProjectBySlug = (slug: string) =>
  projects.find((project) => project.slug === slug);

export const getSortedProjects = (list: Project[] = projects) =>
  [...list].sort((a, b) => {
    if (a.status === b.status) return a.id - b.id;
    return a.status === "active" ? -1 : 1;
  });

export const getFeaturedProjects = () =>
  projects.filter((project) => project.featured);

export default projects;
