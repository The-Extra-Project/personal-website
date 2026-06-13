import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Background } from '@/components/Background';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

export const Features = () => {
  const t = useTranslations('Features');

  return (
    <Background>
      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        <div className="grid grid-cols-1 gap-x-3 gap-y-8 md:grid-cols-3">
          <FeatureCard
            icon={(
              <Image
                src="/assets/images/nextjs-boilerplate-saas-landing-page.png"
                alt="Landing page preview"
                width={800}
                height={500}
                className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            title={t('feature1_title')}
          >
            {t('feature_description1')}
          </FeatureCard>

          <FeatureCard
            icon={(
              <Image
                src="/assets/images/nextjs-boilerplate-saas-user-dashboard.png"
                alt="Dashboard preview"
                width={800}
                height={500}
                className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            title={t('feature2_title')}
          >
            {t('feature_description2')}
          </FeatureCard>

          <FeatureCard
            icon={(
              <Image
                src="/assets/images/nextjs-boilerplate-saas-multi-tenancy.png"
                alt="Team management preview"
                width={800}
                height={500}
                className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            title={t('feature3_title')}
          >
            {t('feature_description3')}
          </FeatureCard>
        </div>
      </Section>
    </Background>
  );
};
