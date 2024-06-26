import { kebabCase, kebabArray } from "@/utils/utils";
import { Project } from "types";

const projects: Project[] = [
  {
    id: 0,
    title: "KeyGeni Group",
    desc: "Developed a professional and budget-conscious WordPress site for KeyGeni Group.",
    img: "/static/projects/kg.jpg",
    link: "https://www.keygeni.com/",
    tags: ["HTML", "CSS", "Javascript", "Wordpress",],
  },
  {
    id: 1,
    title: "The Surveying Experts",
    desc: "Delivered a streamlined WordPress website, highlighting their extensive surveying services.",
    img: "/static/projects/tse.jpg",
    link: "https://www.thesurveyingexperts.com",
    tags: ["HTML", "CSS", "Javascript", "Wordpress"],
  },
  {
    id: 2,
    title: "Manchester Golf Club",
    desc: "An intuitive booking system designed for club members to pick a slot.",
    img: "/static/projects/mangc.jpg",
    link: "https://rangebooking.mangc.co.uk/",
    tags: ["HTML", "CSS", "Javascript", "Python", "Django"],
  },
  {
    id: 3,
    title: "MPJ Recruitment",
    desc: "A robust ATS system, which allows candidates to apply for available jobs.",
    img: "/static/projects/mpj.jpg",
    link: "https://www.mpjrecruitment.co.uk/",
    tags: ["HTML", "CSS", "Javascript", "Wordpress", "AI"],
  },
  {
    id: 4,
    title: "Athol Paints",
    desc: "A stunning catalogue website for a paint manufacturer.",
    img: "/static/projects/athol.png",
    link: "https://www.atholpaints.co.uk/",
    tags: ["HTML", "CSS", "Javascript", "Bootstrap"],
  },
  {
    id: 5,
    title: "AI Chatbot (v1.0)",
    desc: "A Python web application which can be trained to answer FAQs.",
    img: "/static/projects/ai-chatbot.png",
    github: "https://github.com/dev-harrisonw/Holiday-Chat-Agent",
    tags: ["Python", "Flask", "AI"],
  },
  {
    id: 6,
    title: "London Comedy Lunch",
    desc: "An event landing page for the famous LCL, where attendees can get more information.",
    img: "/static/projects/lcl.png",
    link: "https://www.londoncomedylunch.com",
    github: "https://github.com/dev-harrisonw/LCL",
    tags: ["HTML", "CSS", "JavaScript", "JQuery", "Bootstrap"],
  },
  // {
  //   id: 3,
  //   title: "BitcoinTemp",
  //   desc: "A fun way to check the price of bitcoin! Cloudy days, sunny days, and Bitcoin Storms!",
  //   img: "/static/projects/bitcointemp.png",
  //   link: "https://bitcointemp.com",
  //   tags: ["React", "NextJS", "SCSS", "API"],
  // },
  // {
  //   id: 4,
  //   title: "Create HTML Boilerplate",
  //   desc: "Generate a vanilla HTML boilerplate in a flash!",
  //   img: "/static/projects/create-html-boilerplate.png",
  //   github: "https://github.com/BraydenTW/create-html-boilerplate",
  //   tags: ["Node", "Javascript", "NPM", "HTML"],
  // },
  // {
  //   id: 5,
  //   title: "8 Ball in your CLI",
  //   desc: "An 8 ball simulation in your CLI built with Rust!",
  //   img: "/static/projects/8ball-rust.png",
  //   github: "https://github.com/BraydenTW/8ball-rust",
  //   tags: ["Rust", "CLI", "Game"],
  // },
  // {
  //   id: 6,
  //   title: "DontLeaveMe 😭",
  //   desc: "Beg for users to stay on your website.",
  //   img: "/static/projects/dontleaveme.png",
  //   link: "https://github.com/BraydenTW/dontleaveme/",
  //   tags: ["Javascript", "NPM"],
  // },
  // {
  //   id: 7,
  //   title: "Madlibs",
  //   desc: "A simple version of Madlibs built for the web!",
  //   img: "/static/projects/madlibs.png",
  //   link: "https://fillemin.netlify.app/",
  //   github: "https://github.com/braydentw/madlibs",
  //   tags: ["HTML", "CSS", "Javascript"],
  // },
];

export const allTags = []

projects.forEach((project) => {
  project.tags.forEach((tag) => !allTags.includes(tag) && allTags.push(tag))
});

export const allKebabTags = allTags.map(tag => (
  kebabCase(tag)
))

export default projects