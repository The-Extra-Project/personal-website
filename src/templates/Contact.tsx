import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const Contact = () => {
  const t = useTranslations('Contact');

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
      className="py-24 text-center"
    >
      <div className="mt-8 flex justify-center">
        <a href="mailto:contact@extralabs.xyz" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          {t('button_text')}
        </a>
      </div>
      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative h-64 overflow-hidden rounded-xl border border-border/60 shadow-md">
          <Image
            src="/assets/images/nextjs-boilerplate-saas-landing-page-dark-mode.png"
            alt="Dark mode landing page"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="group relative h-64 overflow-hidden rounded-xl border border-border/60 shadow-md">
          <Image
            src="/assets/images/nextjs-boilerplate-saas-user-dashboard-sidebar-dark-mode.png"
            alt="Dark mode dashboard"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="group relative h-64 overflow-hidden rounded-xl border border-border/60 shadow-md">
          <Image
            src="/assets/images/nextjs-boilerplate-saas-user-profile.png"
            alt="User profile page"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">Product snapshots from real application screens used throughout the platform.</p>
    </Section>
  );
};
