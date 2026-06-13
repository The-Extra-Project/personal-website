import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const Progress = () => {
  const t = useTranslations('Progress');

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
      className="my-12 rounded-2xl bg-slate-800 py-24 text-white"
    >
      <div className="relative mt-16 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="absolute left-0 top-1/2 -z-10 hidden h-1 w-full -translate-y-1/2 bg-gray-600 md:block"></div>

        <div className="w-full flex-1 rounded bg-[#b3d4aa] px-6 py-4 text-center font-bold text-black shadow">
          PROTOTYPING
          {' '}
          <br />
          <span className="text-sm font-normal">2023</span>
        </div>

        <div className="relative mt-4 w-full flex-1 rounded bg-[#94c194] px-6 py-4 text-center font-bold text-black shadow md:mt-0">
          <div className="absolute -top-10 left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex">
            <span className="mb-1 text-sm text-white">We're here</span>
            <div className="size-0 border-8 border-transparent border-t-white"></div>
          </div>
          LOCAL VERSION & RESEARCH
          {' '}
          <br />
          <span className="text-sm font-normal">2024-2025</span>
        </div>

        <div className="mt-4 w-full flex-1 rounded bg-[#78a478] px-6 py-4 text-center font-bold text-white opacity-90 shadow md:mt-0">
          GLOBAL LAUNCH
          {' '}
          <br />
          <span className="text-sm font-normal">2026-2027</span>
        </div>
      </div>
    </Section>
  );
};
