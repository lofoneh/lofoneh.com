import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

// TODO: replace placeholder URLs (GitHub, LinkedIn, email) with your real handles when ready.
export const headerData = {
  links: [
    { text: 'Work', href: getPermalink('/work') },
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
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/in/lofoneh' },
    { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:jefferyasamani7@gmail.com' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `© 2026 Jeffery Lofoneh Asamani · Adapted from <a class="underline" href="https://github.com/arthelokyo/astrowind">AstroWind</a> by <a class="underline" href="https://github.com/arthelokyo">@arthelokyo</a>.`,
};
