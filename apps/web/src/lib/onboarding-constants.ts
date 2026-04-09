export const BUILT_IN_TEMPLATES = [
  {
    id: "funaab",
    shortName: "FUNAAB",
    universityName: "Federal University of Agriculture, Abeokuta",
    notes: "NON-AGRICULTURE variant. 3-column Progress Chart. Summary paragraph required.",
  },
  {
    id: "oau",
    shortName: "OAU",
    universityName: "Obafemi Awolowo University",
    notes: "Standard ITF format. Technical notes with numbered sub-headings.",
  },
  {
    id: "unilag",
    shortName: "UNILAG",
    universityName: "University of Lagos",
    notes: "Standard ITF format with additional 'Skills Acquired' column.",
  },
  {
    id: "lasu",
    shortName: "LASU",
    universityName: "Lagos State University",
    notes: "Standard ITF format. Technical notes with bold underlined headings only.",
  },
  {
    id: "futa",
    shortName: "FUTA",
    universityName: "Federal University of Technology, Akure",
    notes: "Engineering variant with additional 'Equipment Used' field.",
  },
  {
    id: "custom",
    shortName: "Other",
    universityName: "My university is not listed",
    notes: "You can describe your format and we'll match it.",
  },
] as const;

export const INDUSTRIES = [
  "ICT / Technology",
  "Banking & Finance",
  "Oil & Gas",
  "Manufacturing",
  "Healthcare",
  "Construction & Engineering",
  "Government / Public Service",
  "Education",
  "Agriculture",
  "Telecommunications",
  "Retail & Commerce",
  "Media & Communications",
  "Law",
  "Accounting & Audit",
  "Other",
] as const;

export const LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
  "HND 1",
  "HND 2",
  "Postgraduate",
] as const;

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const POPULAR_UNIVERSITIES = [
  "Federal University of Agriculture, Abeokuta (FUNAAB)",
  "Obafemi Awolowo University (OAU)",
  "University of Lagos (UNILAG)",
  "Lagos State University (LASU)",
  "Federal University of Technology, Akure (FUTA)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Ibadan (UI)",
  "University of Benin (UNIBEN)",
  "Federal University of Technology, Owerri (FUTO)",
  "University of Port Harcourt (UNIPORT)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "Bayero University Kano (BUK)",
  "University of Ilorin (UNILORIN)",
  "Covenant University",
  "Landmark University",
  "Lagos State University of Science and Technology (LASUSTECH)",
  "Federal University, Oye-Ekiti (FUOYE)",
  "Afe Babalola University (ABUAD)",
  "Redeemer's University",
] as const;

export const COMPANY_DEPARTMENTS = [
  "IT / Technology",
  "Finance & Accounts",
  "Engineering",
  "Operations",
  "Human Resources",
  "Marketing & Sales",
  "Customer Service",
  "Procurement",
  "Admin & Management",
  "Legal",
  "Production",
  "Quality Control",
  "Research & Development",
  "Health & Safety",
] as const;
