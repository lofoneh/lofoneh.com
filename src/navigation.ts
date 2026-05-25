import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Experience', href: getPermalink('/experience') },
    { text: 'Projects', href: getPermalink('/projects') },
    { text: 'Writing', href: getBlogPermalink() },
    { text: 'About', href: getPermalink('/about') },
  ],
  actions: [{ text: 'Resume', href: '/resume.pdf', target: '_blank' }],
};

export const footerData = {
  links: [],
  secondaryLinks: [],
  socialLinks: [
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/lofoneh' },
    { ariaLabel: 'X (Twitter)', icon: 'tabler:brand-x', href: 'https://x.com/lofoneh' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/in/jeffery-asamani/' },
    { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:jefferyasamani7@gmail.com' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `© 2026 Jeffery Lofoneh Asamani.`,
};
