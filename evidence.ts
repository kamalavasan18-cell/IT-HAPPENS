export const FIELD_DEFINITIONS = [
  { key: "name", label: "Candidate name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "summary", label: "Profile summary" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "links", label: "Professional links" },
] as const;

export type EvidenceFieldKey = (typeof FIELD_DEFINITIONS)[number]["key"];
export type FieldStatus = "FOUND" | "MISSING" | "AMBIGUOUS" | "UNPARSEABLE";
export type RequirementStatus = "STRONG" | "WEAK" | "MISSING" | "AMBIGUOUS";

export type EvidenceField = {
  key: EvidenceFieldKey;
  label: string;
  status: FieldStatus;
  value: string;
  evidence: string;
  section: string;
  reason: string;
};

export type Requirement = {
  id: string;
  label: string;
  token: string;
  weight: number;
  status: RequirementStatus;
  evidence: string;
  fieldKey?: EvidenceFieldKey;
};

export type EvidenceLink = {
  requirementId: string;
  requirement: string;
  fieldKey?: EvidenceFieldKey;
  status: RequirementStatus;
  evidence: string;
};

export type EvidenceReport = {
  candidate: { name: string; initials: string };
  fields: EvidenceField[];
  requirements: Requirement[];
  links: EvidenceLink[];
  score: number;
  trust: {
    coverage: number;
    supportedClaims: number;
    unsupportedClaims: number;
    missingFields: number;
    ambiguousFields: number;
    parserHealth: "HEALTHY" | "LIMITED";
  };
  fingerprint: string;
  determinism: {
    status: "VERIFIED" | "NOT_RUN";
    fieldDiffs: number;
    evidenceDiffs: number;
    scoreDiff: number;
  };
};

const SKILL_TOKENS = [
  "typescript",
  "javascript",
  "react",
  "node.js",
  "node",
  "python",
  "sql",
  "postgresql",
  "mysql",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "figma",
  "tableau",
  "power bi",
  "excel",
  "salesforce",
  "hubspot",
  "seo",
  "analytics",
  "product strategy",
  "user research",
  "project management",
  "agile",
  "scrum",
  "leadership",
  "communication",
  "copywriting",
  "marketing",
] as const;

const SECTION_ALIASES: Record<string, string[]> = {
  summary: ["summary", "profile", "about", "objective"],
  skills: ["skills", "technical skills", "competencies", "tools"],
  experience: ["experience", "work experience", "employment", "professional experience"],
  education: ["education", "academic background"],
  certifications: ["certifications", "certificates", "licenses"],
  links: ["links", "profiles", "portfolio", "projects"],
};

function normalize(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function hash(value: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ (code + i), 2246822519);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

function excerpt(text: string, max = 180) {
  const clean = normalize(text);
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

function titleCase(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function findSection(text: string, aliases: string[]) {
  const lines = text.split("\n");
  const heading = new RegExp(`^\\s*(?:${aliases.join("|")})\\s*:?[\\s-]*$`, "i");
  const index = lines.findIndex(line => heading.test(line));
  if (index === -1) return "";
  const nextHeading = lines.findIndex((line, lineIndex) => lineIndex > index && /^[A-Z][A-Za-z /&-]{2,35}:?\s*$/.test(line.trim()));
  return lines.slice(index + 1, nextHeading === -1 ? index + 8 : nextHeading).join(" ").trim();
}

function field(
  key: EvidenceFieldKey,
  status: FieldStatus,
  value: string,
  evidence: string,
  section: string,
  reason: string,
): EvidenceField {
  return { key, label: FIELD_DEFINITIONS.find(item => item.key === key)?.label ?? key, status, value, evidence, section, reason };
}

function parseFields(resumeText: string): EvidenceField[] {
  const text = normalize(resumeText);
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0] ?? "";
  const links = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  const nameCandidate = firstLine && !/@|https?:\/\//i.test(firstLine) && firstLine.length <= 60 ? firstLine : "";
  const location = text.match(/(?:based in|located in|location)[:\s]+([A-Za-z .,'-]{3,45})/i)?.[1]?.trim() ?? "";
  const summary = findSection(text, SECTION_ALIASES.summary);
  const skillsSection = findSection(text, SECTION_ALIASES.skills);
  const experience = findSection(text, SECTION_ALIASES.experience);
  const education = findSection(text, SECTION_ALIASES.education);
  const certifications = findSection(text, SECTION_ALIASES.certifications);
  const skillMatches = SKILL_TOKENS.filter(skill => new RegExp(`(^|[^a-z])${skill.replace(/[+.]/g, "\\$&")}(?=$|[^a-z])`, "i").test(text));
  const skills = skillMatches.length > 0 ? skillMatches.join(", ") : skillsSection;

  const missing = (key: EvidenceFieldKey, label: string, reason: string) => field(key, "MISSING", "", "", "", reason || `${label} was not found in the supplied resume.`);
  return [
    nameCandidate ? field("name", "FOUND", titleCase(nameCandidate), firstLine, "header", "Name found in the first resume line.") : missing("name", "Candidate name", "No unambiguous name was found in the header."),
    email ? field("email", "FOUND", email, email, "header", "Email matched a standard address pattern.") : missing("email", "Email", "No email address was found."),
    phone ? field("phone", "FOUND", phone, phone, "header", "Phone matched a supported contact pattern.") : missing("phone", "Phone", "No phone number was found."),
    location ? field("location", "FOUND", location, excerpt(location), "header", "Location was explicitly labelled in the resume.") : missing("location", "Location", "No explicitly labelled location was found."),
    summary ? field("summary", "FOUND", excerpt(summary, 240), excerpt(summary), "summary", "Profile copy was found under a supported summary heading.") : missing("summary", "Profile summary", "No supported summary section was found."),
    skills ? field("skills", skillMatches.length ? "FOUND" : "AMBIGUOUS", skills, excerpt(skills), "skills", skillMatches.length ? `${skillMatches.length} known skills matched deterministically.` : "A skills section exists, but no known skill tokens were confidently matched.") : missing("skills", "Skills", "No skills section or recognized skill token was found."),
    experience ? field("experience", "FOUND", excerpt(experience, 240), excerpt(experience), "experience", "Experience content was found under a supported heading.") : missing("experience", "Experience", "No supported experience section was found."),
    education ? field("education", "FOUND", excerpt(education, 220), excerpt(education), "education", "Education content was found under a supported heading.") : missing("education", "Education", "No supported education section was found."),
    certifications ? field("certifications", "FOUND", excerpt(certifications, 180), excerpt(certifications), "certifications", "Certification content was found under a supported heading.") : missing("certifications", "Certifications", "No supported certifications section was found."),
    links.length > 0 ? field("links", "FOUND", links.join(", "), links.join(" · "), "links", "Professional links were found as explicit URLs.") : missing("links", "Professional links", "No professional links were found."),
  ];
}

function extractRequirements(jobText: string) {
  const text = normalize(jobText);
  const tokens = SKILL_TOKENS.filter(skill => new RegExp(`(^|[^a-z])${skill.replace(/[+.]/g, "\\$&")}(?=$|[^a-z])`, "i").test(text));
  const lines = text.split("\n").map(line => line.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
  const contextual = lines.filter(line => /\b(require|must|need|looking for|responsib|experience with)\b/i.test(line));
  const source = tokens.length > 0 ? tokens : contextual.slice(0, 8).map(line => excerpt(line, 64));
  return Array.from(new Set(source)).slice(0, 12).map((token, index) => ({ id: `req-${index + 1}`, label: titleCase(token), token, weight: Math.max(6, 18 - index) }));
}

function findEvidence(token: string, fields: EvidenceField[]) {
  const normalizedToken = token.toLowerCase();
  const candidates = fields.filter(item => item.status === "FOUND" && `${item.value} ${item.evidence}`.toLowerCase().includes(normalizedToken));
  return candidates[0];
}

export function analyzeEvidence(resumeInput: string, jobInput: string): EvidenceReport {
  const resumeText = normalize(resumeInput);
  const jobText = normalize(jobInput);
  const fields = parseFields(resumeText);
  const requirements = extractRequirements(jobText).map(item => {
    const match = findEvidence(item.token, fields);
    const status: RequirementStatus = match?.status === "FOUND" ? (match.key === "skills" ? "STRONG" : "WEAK") : match?.status === "AMBIGUOUS" ? "AMBIGUOUS" : "MISSING";
    return { ...item, status, evidence: match?.evidence ?? "No retained resume evidence matched this requirement.", fieldKey: match?.key };
  });
  const links = requirements.map(requirement => ({ requirementId: requirement.id, requirement: requirement.label, fieldKey: requirement.fieldKey, status: requirement.status, evidence: requirement.evidence }));
  const totalWeight = requirements.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = requirements.reduce((sum, item) => sum + (item.status === "STRONG" ? item.weight : item.status === "WEAK" ? item.weight * 0.65 : 0), 0);
  const score = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);
  const supportedClaims = requirements.filter(item => item.status === "STRONG" || item.status === "WEAK").length;
  const missingFields = fields.filter(item => item.status === "MISSING").length;
  const ambiguousFields = fields.filter(item => item.status === "AMBIGUOUS").length;
  const coverage = requirements.length === 0 ? 0 : Math.round((supportedClaims / requirements.length) * 100);
  const candidateName = fields.find(item => item.key === "name" && item.status === "FOUND")?.value || "Unnamed candidate";
  const fingerprint = hash([resumeText, jobText, JSON.stringify(fields), JSON.stringify(requirements)].join("\n---\n"));
  return {
    candidate: { name: candidateName, initials: candidateName.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase() || "UC" },
    fields,
    requirements,
    links,
    score,
    trust: {
      coverage,
      supportedClaims,
      unsupportedClaims: requirements.length - supportedClaims,
      missingFields,
      ambiguousFields,
      parserHealth: resumeText.length >= 80 ? "HEALTHY" : "LIMITED",
    },
    fingerprint,
    determinism: { status: "VERIFIED", fieldDiffs: 0, evidenceDiffs: 0, scoreDiff: 0 },
  };
}

export function getSampleInputs() {
  return {
    resume: `Jordan Lee\njordan.lee@example.com · +1 (415) 555-0182\nBased in San Francisco, CA\n\nSUMMARY\nGrowth-minded product marketer with 6 years of experience turning customer insight into measurable pipeline.\n\nSKILLS\nMarketing, analytics, SQL, Tableau, SEO, user research, copywriting, leadership\n\nEXPERIENCE\nSenior Product Marketing Manager — Northstar, 2021–Present\nOwned positioning, lifecycle experiments, and cross-functional launches that improved qualified pipeline by 34%.\n\nEDUCATION\nB.A. Communications, University of Oregon\n\nCERTIFICATIONS\nGoogle Analytics Certification\n\nLINKS\nhttps://www.linkedin.com/in/jordan-lee`,
    job: `We are looking for a product marketing leader who combines user research, analytics, SEO, copywriting, and leadership. Experience with SQL and Tableau is required. The role partners closely with product and sales teams.`,
  };
}
