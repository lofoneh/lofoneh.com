import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Experience', href: getPermalink('/experience') },
    { text: 'Projects', href: getPermalink('/projects') },
    { text: 'Writing', href: getBlogPermalink() },
  ],
  actions: [{ text: 'Resume', href: '/resume.pdf', target: '_blank' }],
};

// Footer surfaces "find me" text-link socials + tagline + copyright.
// The Footer component renders these as text (not icons) — keep the order
// consistent with how a reader would scan: most-active channels first.
export const footerData = {
  socialLinks: [
    { text: 'github', href: 'https://github.com/lofoneh' },
    { text: 'linkedin', href: 'https://www.linkedin.com/in/jeffery-asamani/' },
    { text: 'x', href: 'https://x.com/lofoneh' },
    { text: 'email', href: 'mailto:jefferyasamani7@gmail.com' },
    { text: 'rss', href: getAsset('/rss.xml') },
  ],
  tagline: 'building reliable systems & infrastructure',
  footNote: '© 2026 | Jeffery Lofoneh Asamani',
};
