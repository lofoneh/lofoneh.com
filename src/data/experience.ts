/**
 * Career history, skills, education, and certifications shown in the experience section.
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
  items: string[];
}

export interface EducationEntry {
  institution: string;
  location: string;
  degree: string;
  start: string;
  end: string;
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
      'Build CI/CD pipelines on Azure DevOps and Azure Kubernetes Service (AKS) that build, test and release applications.',
      'Rolled out the LGTM observability stack (Loki, Grafana, Tempo, Prometheus) across production applications, cutting mean incident resolution time by about 50%.',
      'Deploy and troubleshoot web and USSD applications built in C#/.NET and React across several environments.',
      'Set up and administer PostgreSQL and MongoDB, including configuration, access control and backups.',
      'Monitor servers and live endpoints with Uptime Kuma, alerting to Microsoft Teams on downtime.',
      'Developing a Go CLI for on-premises CI/CD and operations: it deploys apps, backs up and restores apps and databases, and installs packages offline on air-gapped Linux servers over SSH.',
    ],
  },
  {
    title: 'DevOps Engineering Intern',
    company: 'Adaptive Computer Solutions Ltd',
    location: 'Accra, Ghana',
    start: 'Feb 2024',
    end: 'Aug 2024',
    bullets: [
      'Automated health monitoring of 12 Linux and 5 Windows servers with Bash and PowerShell, replacing manual checks.',
      'Deployed and configured applications and services in on-premises environments.',
    ],
  },
  {
    title: 'Independent Software Development & Study',
    company: 'Self-directed',
    start: 'Nov 2022',
    end: 'Feb 2024',
    bullets: [
      'Taught myself programming, cloud and DevOps through hands-on projects, then moved into a professional DevOps role.',
    ],
  },
];

// Skill categories, mirroring the CV. Chips render as plain lowercase text.
export const skills: SkillCategory[] = [
  { label: 'Cloud & infrastructure', items: ['aws', 'azure', 'digitalocean', 'terraform', 'ansible'] },
  {
    label: 'Containers & Kubernetes',
    items: ['docker', 'kubernetes', 'helm', 'kind', 'controller-runtime', 'traefik'],
  },
  {
    label: 'CI/CD & observability',
    items: ['github actions', 'azure devops', 'prometheus', 'grafana', 'loki', 'tempo', 'opentelemetry', 'uptime kuma'],
  },
  { label: 'Languages', items: ['go', 'rust', 'python', 'typescript', 'ruby', 'bash', 'powershell'] },
  { label: 'Databases', items: ['postgresql', 'mongodb', 'supabase', 'redis', 'kividb'] },
  { label: 'Frameworks', items: ['react', 'next.js', 'expo', 'django', 'fastapi', 'gin', 'prisma', 'rails'] },
];

export const education: EducationEntry[] = [
  {
    institution: 'Kwame Nkrumah University of Science and Technology (KNUST)',
    location: 'Kumasi, Ghana',
    degree: 'BSc Metallurgical Engineering',
    start: 'Aug 2018',
    end: 'Nov 2022',
  },
];

export const certifications: Certification[] = [
  { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services' },
  { name: 'Microsoft Azure Fundamentals (AZ-900)', issuer: 'Microsoft' },
  { name: 'Introduction to FinOps', issuer: 'FinOps Foundation' },
  { name: 'Professional Foundations', issuer: 'ALX Africa' },
];
