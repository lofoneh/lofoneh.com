/**
 * Career history, education, and certifications shown on /experience.
 * Source of truth is the resume — keep this file in sync when the resume updates.
 */

export interface Role {
  title: string;
  company: string;
  location: string;
  start: string; // human-readable, e.g. "Aug 2024"
  end: string; // "Present" or "Mar 2024"
  bullets: string[];
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
    company: 'Adaptive Computer Solutions Limited',
    location: 'Accra, Ghana',
    start: 'Aug 2024',
    end: 'Present',
    bullets: [
      'Build CI/CD pipelines on Azure DevOps that deploy services to Azure Kubernetes Service (AKS).',
      'Stood up application observability with OpenTelemetry and the ELK stack.',
      'On-call for application monitoring and incident triage to keep production stable.',
    ],
  },
  {
    title: 'DevOps Engineering Intern',
    company: 'Adaptive Computer Solutions Limited',
    location: 'Accra, Ghana',
    start: 'Feb 2024',
    end: 'Aug 2024',
    bullets: [
      'Wrote bash scripts to automate monitoring of remote servers.',
      'Set up and deployed applications and services in on-premise environments.',
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
