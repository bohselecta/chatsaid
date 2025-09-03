export type CategoryKey = 'funny' | 'weird' | 'technical' | 'research' | 'ideas';

export type Category = {
  key: CategoryKey;
  label: string;
  href: string;      // e.g. "/branch/funny"
  iconPath: string;  // path under public/, e.g. "/funny.svg"
};

export const CATEGORIES: Category[] = [
  { key: 'funny',     label: 'Funny',     href: '/branch/funny',     iconPath: '/funny.svg' },
  { key: 'weird',     label: 'Weird',     href: '/branch/weird',     iconPath: '/weird.svg' },
  { key: 'technical', label: 'Technical', href: '/branch/technical', iconPath: '/technical.svg' },
  { key: 'research',  label: 'Research',  href: '/branch/research',  iconPath: '/research.svg' },
  { key: 'ideas',     label: 'Ideas',     href: '/branch/ideas',     iconPath: '/ideas.svg' },
];
