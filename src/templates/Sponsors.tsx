import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const Sponsors = () => {
  const t = useTranslations('Sponsors');

  return (
    <Section className="my-12 rounded-xl bg-gray-50 py-12 text-center dark:bg-slate-900/50">
      <h2 className="mb-10 text-2xl font-bold">{t('title')}</h2>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
        {/* Région Île-de-France */}
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border/75 bg-background/95 p-6 shadow-md transition-all hover:border-purple-500/30 hover:shadow-lg">
          <svg className="h-14 w-auto" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 8L23 23L37 20L27 28L34 41L23 33L16 43L18 28L7 24L18 20L20 8Z" fill="#E05B35" />
            <text x="50" y="30" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="19" className="fill-slate-900 dark:fill-white">Région</text>
            <text x="50" y="47" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="15" className="fill-slate-900 dark:fill-white">îledeFrance</text>
          </svg>
        </div>

        {/* Protocol Labs */}
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border/75 bg-background/95 p-6 shadow-md transition-all hover:border-purple-500/30 hover:shadow-lg">
          <svg className="h-14 w-auto" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L30 13.5V30.5L15 39L0 30.5V13.5L15 5Z" className="fill-blue-600/10 stroke-blue-600 dark:fill-blue-400/10 dark:stroke-blue-400" strokeWidth="2" />
            <path d="M15 5V39" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
            <path d="M0 13.5L15 22L30 13.5" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
            <path d="M0 30.5L15 22L30 30.5" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
            <text x="42" y="31" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="17" letterSpacing="-0.03em" className="fill-slate-900 dark:fill-white">PROTOCOL LABS</text>
          </svg>
        </div>

        {/* IGN France */}
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border/75 bg-background/95 p-6 shadow-md transition-all hover:border-purple-500/30 hover:shadow-lg">
          <svg className="h-14 w-auto" viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="25" r="18" fill="#10B981" />
            <text x="20" y="30" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#FFFFFF" textAnchor="middle" letterSpacing="0.05em">IGN</text>
            <text x="48" y="27" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13" className="fill-slate-900 dark:fill-white">FRANCE</text>
            <text x="48" y="38" fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="8" className="fill-slate-500 dark:fill-slate-400" letterSpacing="0.02em">GEOSPATIAL INSTITUTE</text>
          </svg>
        </div>
      </div>
    </Section>
  );
};
