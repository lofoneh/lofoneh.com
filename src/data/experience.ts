/**
 * Career history, skills, education, and certifications shown on /experience.
 * Source of truth is the resume — keep this file in sync when the resume updates.
 */

export interface Role {
  title: string;
  company: string;
  location?: string;
  start: string; // human-readable, e.g. "Aug 2024"
  end: string; // "Present" or "Mar 2024"
  bullets: string[];
}

export interface SkillCategory {
  label: string;
  items: { slug: string; learning?: boolean }[];
}

export interface EducationEntry {
  institution: string;
  location: string;
  degree: string;
  start: string;
  end: string;
  coursework?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
}

export const roles: Role[] = [
  {
    title: 'DevOps Engineer',
    company: 'Adaptive Computer Solutions Ltd',
    location: 'Accra, Ghana',
    start: 'Aug 2024',
    end: 'Present',
    bullets: [
      'Build CI/CD pipelines on Azure DevOps and Azure Kubernetes Service (AKS) to build, test, and release applications.',
      'Deployed the LGTM observability stack (Loki, Grafana, Tempo, Prometheus) across production applications, cutting mean incident resolution time by ~50%.',
      'Deploy and troubleshoot Web and USSD applications built in C#/.NET and React across multiple environments.',
      'Set up and administer PostgreSQL and MongoDB databases, including configuration, access control, and backups.',
      'Set up Uptime Kuma to monitor servers and live endpoints, with alerts integrated into Microsoft Teams for real-time downtime notifications.',
      'Developing a Go CLI tool to standardize CI/CD and operational tasks for on-premises deployments.',
    ],
  },
  {
    title: 'DevOps Engineering Intern',
    company: 'Adaptive Computer Solutions Ltd',
    location: 'Accra, Ghana',
    start: 'Feb 2024',
    end: 'Aug 2024',
    bullets: [
      'Wrote Bash and PowerShell scripts to automate health monitoring of 12 Linux and 5 Windows servers, replacing manual checks and improving reliability.',
      'Deployed and configured applications and services in on-premises environments.',
    ],
  },
  {
    title: 'Independent Software Development & Study',
    company: 'Self-directed',
    start: 'Nov 2022',
    end: 'Feb 2024',
    bullets: [
      'Self-taught programming, cloud, and DevOps fundamentals while building hands-on projects, transitioning into a professional DevOps career.',
    ],
  },
];

// Skill categories — mirrors the resume's SKILLS block, grouped for /experience.
// Slugs resolve via src/data/stack-icons.ts; unknown slugs fall back to mono text.
export const skills: SkillCategory[] = [
  {
    label: 'Languages',
    items: [{ slug: 'python' }, { slug: 'ruby' }, { slug: 'go' }, { slug: 'typescript' }],
  },
  {
    label: 'Cloud & DevOps',
    items: [
      { slug: 'aws' },
      { slug: 'azure' },
      { slug: 'docker' },
      { slug: 'kubernetes' },
      { slug: 'terraform' },
      { slug: 'ansible' },
      { slug: 'traefik' },
    ],
  },
  {
    label: 'CI/CD & Observability',
    items: [
      { slug: 'github-actions' },
      { slug: 'azure-devops' },
      { slug: 'grafana' },
      { slug: 'loki' },
      { slug: 'tempo' },
      { slug: 'prometheus' },
      { slug: 'opentelemetry' },
      { slug: 'uptime-kuma' },
    ],
  },
  {
    label: 'Databases',
    items: [{ slug: 'postgresql' }, { slug: 'mongodb' }],
  },
  {
    label: 'Frameworks',
    items: [
      { slug: 'react' },
      { slug: 'nextjs' },
      { slug: 'django' },
      { slug: 'fastapi' },
      { slug: 'gin' },
      { slug: 'prisma' },
      { slug: 'rails' },
    ],
  },
];

export const education: EducationEntry[] = [
  {
    institution: 'Kwame Nkrumah University of Science and Technology (KNUST)',
    location: 'Kumasi, Ghana',
    degree: 'BSc Metallurgical Engineering',
    start: 'Aug 2018',
    end: 'Nov 2022',
    coursework: ['MATLAB', 'Python programming', 'Data analysis', 'Project management'],
  },
];

export const certifications: Certification[] = [
  { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services' },
  { name: 'Microsoft Azure Fundamentals (AZ-900)', issuer: 'Microsoft' },
  { name: 'Introduction to FinOps', issuer: 'FinOps Foundation' },
  { name: 'Professional Foundations', issuer: 'ALX Africa' },
];
