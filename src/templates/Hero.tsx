import { ArrowRightIcon } from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-36">
      <CenteredHero
        banner={(
          <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t('subtitle')}
          </div>
        )}
        title={t('title')}
        description={t('description')}
        buttons={(
          <>
            <a
              className={buttonVariants({ variant: 'default', size: 'lg' })}
              href="https://forms.gle/MDxBV7ATX3DAEJRi7"
            >
              {t('primary_button')}
            </a>

            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="/faq"
            >
              {t('secondary_button')}
            </a>

            <a
              className={buttonVariants({ size: 'lg' })}
              href="https://nextjs-boilerplate.com/nextjs-multi-tenant-saas-boilerplate"
            >
              {t('primary_button')}
              <ArrowRightIcon className="ml-1 size-5" />
            </a>
          </>
        )}
      />
    </Section>
  );
};
