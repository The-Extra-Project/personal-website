import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';
import { WaitingListForm } from '@/features/landing/WaitingListForm';

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
              href="#waiting-list"
            >
              {t('primary_button')}
            </a>

            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="/faq"
            >
              {t('secondary_button')}
            </a>
          </>
        )}
      />
      <div id="waiting-list" className="mt-12 flex justify-center">
        <WaitingListForm />
      </div>
    </Section>
  );
};
