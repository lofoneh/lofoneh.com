/**
 * Hand-written projects shown in the Projects section (rendered after any
 * GitHub-synced own repos). Keep `slug` unique.
 */

export interface Project {
  slug: string;
  title: string;
  oneLiner: string;
  meta: string;
  links: { live?: string };
}

export const projects: Project[] = [
  {
    slug: 'giftbanc',
    title: 'GiftBanc',
    oneLiner:
      'Built and run the CI/CD and hosting for a live e-commerce gift card platform, working with one developer.',
    meta: 'contract · devops',
    links: { live: 'https://giftbanc.com' },
  },
  {
    slug: 'win-transport',
    title: 'WIN Transport',
    oneLiner: 'Built the admin portal for a live bus-booking platform with one other developer.',
    meta: 'contract · full-stack',
    links: { live: 'https://wintransportservices.com' },
  },
  {
    slug: 'win-church',
    title: 'WIN Church',
    oneLiner:
      'A multi-tenant church administration platform with role-based access, member and group management, and attendance reporting.',
    meta: 'live · multi-tenant',
    links: { live: 'https://win-admin-alpha.vercel.app' },
  },
  {
    slug: 'iac-studio',
    title: 'IaC Studio',
    oneLiner:
      'Turns a cloud architecture drawn on a canvas into Terraform for AWS, GCP, Azure or DigitalOcean, with plan and apply run in background workers.',
    meta: 'private',
    links: {},
  },
];
