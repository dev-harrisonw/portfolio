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
  employmentType?: string;
  location?: string;
  workMode?: string;
  logo?: string;
  roles: ExperienceRole[];
};

const experience: ExperienceItem[] = [
  {
    company: "Don't Panic Events",
    employmentType: "Full-time",
    location: "Rawtenstall, England, United Kingdom",
    workMode: "Hybrid",
    roles: [
      {
        title: "Junior Web Developer",
        startDate: "2026-03",
        endDate: null,
        employmentType: "Full-time",
        location: "Rawtenstall, England, United Kingdom",
        workMode: "Hybrid",
      },
    ],
  },
  {
    company: "href agency",
    employmentType: "Full-time",
    location: "Altrincham, England, United Kingdom",
    workMode: "Hybrid",
    roles: [
      {
        title: "Junior Web Developer",
        startDate: "2025-12",
        endDate: "2026-02",
        employmentType: "Full-time",
        location: "Altrincham, England, United Kingdom",
        workMode: "Hybrid",
        skills: ["Cascading Style Sheets (CSS)", "Tailwind CSS"],
      },
    ],
  },
  {
    company: "GigaStudios",
    employmentType: "Full-time",
    location: "Manchester Area, United Kingdom",
    workMode: "Remote",
    roles: [
      {
        title: "Director",
        startDate: "2023-01",
        endDate: "2025-12",
        employmentType: "Full-time",
        location: "Manchester Area, United Kingdom",
        workMode: "Remote",
        skills: ["Cascading Style Sheets (CSS)", "IT Infrastructure Management"],
      },
    ],
  },
  {
    company: "Inconnection",
    employmentType: "Apprenticeship",
    location: "Manchester Area, United Kingdom",
    workMode: "Hybrid",
    roles: [
      {
        title: "DevOps Engineer",
        startDate: "2022-08",
        endDate: "2023-07",
        location: "Manchester Area, United Kingdom",
        skills: ["Cascading Style Sheets (CSS)", "IT Infrastructure Management"],
      },
      {
        title: "Software Engineer",
        startDate: "2021-04",
        endDate: "2022-08",
        location: "Manchester, England, United Kingdom",
        skills: ["Cascading Style Sheets (CSS)", "IT Infrastructure Management"],
      },
    ],
  },
];

export default experience;
