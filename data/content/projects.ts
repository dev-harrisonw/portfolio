import { kebabCase, kebabArray } from "@/utils/utils";
import { Project } from "types";

const projects: Project[] = [
  {
    id: 0,
    title: "The Garm Plug",
    desc: "An all-in-one platform for sourcing, repairing, and reselling clothing.",
    img: "/static/projects/thegarmplug.jpg",
    link: "https://www.thegarmplug.com/",
    tags: ["WordPress", "PHP", "Tailwind", "JavaScript"],
  },
  {
    id: 1,
    title: "KeyGeni Group",
    desc: "A professional, budget-conscious WordPress website built for a growing business.",
    img: "/static/projects/kg.jpg",
    link: "https://www.keygeni.com/",
    tags: ["HTML", "CSS", "JavaScript", "WordPress"],
  },
  {
    id: 2,
    title: "The Surveying Experts",
    desc: "A streamlined WordPress site showcasing a full range of surveying services.",
    img: "/static/projects/tse.jpg",
    link: "https://www.thesurveyingexperts.com",
    tags: ["HTML", "CSS", "JavaScript", "WordPress"],
  },
  {
    id: 3,
    title: "Manchester Golf Club",
    desc: "A custom booking system allowing members to easily reserve time slots.",
    img: "/static/projects/mangc.jpg",
    link: "https://rangebooking.mangc.co.uk/",
    tags: ["HTML", "CSS", "JavaScript", "Python", "Django"],
  },
  {
    id: 4,
    title: "MPJ Recruitment",
    desc: "A robust ATS platform enabling candidates to browse and apply for jobs efficiently.",
    img: "/static/projects/mpj.jpg",
    link: "https://www.mpjrecruitment.co.uk/",
    tags: ["HTML", "CSS", "JavaScript", "WordPress", "AI"],
  },
  {
    id: 5,
    title: "Athol Paints",
    desc: "A clean, catalogue-style website built for a paint manufacturer.",
    img: "/static/projects/athol.png",
    link: "https://www.atholpaints.co.uk/",
    tags: ["HTML", "CSS", "JavaScript", "Bootstrap"],
  },
  {
    id: 6,
    title: "AI Chatbot (v1.0)",
    desc: "A Python web application trained to handle FAQs and automate responses.",
    img: "/static/projects/ai-chatbot.png",
    github: "https://github.com/dev-harrisonw/Holiday-Chat-Agent",
    tags: ["Python", "Flask", "AI"],
  },
  {
    id: 7,
    title: "London Comedy Lunch",
    desc: "An event landing page providing key information and booking details for attendees.",
    img: "/static/projects/lcl.png",
    link: "https://www.londoncomedylunch.com",
    github: "https://github.com/dev-harrisonw/LCL",
    tags: ["HTML", "CSS", "JavaScript", "jQuery", "Bootstrap"],
  },
];

export const allTags = [];

projects.forEach((project) => {
  project.tags.forEach((tag) => !allTags.includes(tag) && allTags.push(tag));
});

export const allKebabTags = allTags.map((tag) => kebabCase(tag));

export default projects;