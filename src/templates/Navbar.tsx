import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Section } from '@/features/landing/Section';

import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');

  return (
    <Section className="px-3 py-6">
      <CenteredMenu
        logo={<Logo />}
        rightMenu={(
          <li className="ml-1 mr-2.5" data-fade>
            <Link href="mailto:contact@extralabs.xyz">{t('contact')}</Link>
          </li>
        )}
      >
        <li className="ml-1 mr-2.5" data-fade>
          <Link href="/faq">{t('faq')}</Link>
        </li>
        <li className="ml-1 mr-2.5" data-fade>
          <Link href="https://discord.com">{t('discord')}</Link>
        </li>
        <li className="ml-1 mr-2.5" data-fade>
          <Link href="https://forms.gle">{t('waiting_list')}</Link>
        </li>
        <li className="ml-1 mr-2.5" data-fade>
          <Link href="https://medium.com/circum-protocol">{t('blog')}</Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
