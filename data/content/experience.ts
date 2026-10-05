export type ExperienceRole = {
  title: string;
  startDate: string;
  endDate?: string | null;
  employmentType?: string;
  location?: string;
  workMode?: string;
  skills?: string[];
};

export type ExperienceItem = {
  company: string;
  website?: string;
  logo?: string;
  logoFit?: "cover" | "contain";
  logoBg?: string;
  employmentType?: string;
  location?: string;
  workMode?: string;
  roles: ExperienceRole[];
};

const experience: ExperienceItem[] = [
  {
    company: "Don't Panic Events",
    website: "https://dontpanicprojects.com",
    logo: "/static/companies/dontpanic.jpg",
    logoFit: "cover",
    employmentType: "Full-time",
    location: "Rawtenstall",
    workMode: "Hybrid",
    roles: [
      {
        title: "Junior Web Developer",
        startDate: "2026-03",
        endDate: null,
      },
    ],
  },
  {
    company: "href agency",
    website: "https://hrefagency.co.uk",
    logo: "/static/companies/href.png",
    logoFit: "contain",
    logoBg: "bg-black",
    employmentType: "Full-time",
    location: "Altrincham",
    workMode: "Hybrid",
    roles: [
      {
        title: "Junior Web Developer",
        startDate: "2025-12",
        endDate: "2026-02",
        skills: ["CSS", "Tailwind"],
      },
    ],
  },
  {
    company: "GigaStudios",
    website: "https://www.gigastudios.co.uk",
    logo: "/static/companies/giga.png",
    logoFit: "contain",
    logoBg: "bg-black",
    employmentType: "Full-time",
    location: "Manchester",
    workMode: "Remote",
    roles: [
      {
        title: "Director",
        startDate: "2023-01",
        endDate: "2025-12",
        skills: ["CSS", "Infrastructure"],
      },
    ],
  },
  {
    company: "Inconnection",
    website: "https://inconnection.com",
    logo: "/static/companies/inconnection.png",
    logoFit: "cover",
    logoBg: "bg-white",
    employmentType: "Apprenticeship",
    location: "Manchester",
    workMode: "Hybrid",
    roles: [
      {
        title: "DevOps Engineer",
        startDate: "2022-08",
        endDate: "2023-07",
        skills: ["Infrastructure", "CSS"],
      },
      {
        title: "Software Engineer",
        startDate: "2021-04",
        endDate: "2022-08",
        location: "Manchester",
        skills: ["CSS", "Infrastructure"],
      },
    ],
  },
];

export default experience;
