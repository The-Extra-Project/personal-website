import dynamic from 'next/dynamic';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { Contact } from '@/templates/Contact';
import { Features } from '@/templates/Features';
import { Footer } from '@/templates/Footer';
import { Hero } from '@/templates/Hero';
import { Navbar } from '@/templates/Navbar';
import { Progress } from '@/templates/Progress';
import { Sponsors } from '@/templates/Sponsors';

const PointCloudViewer = dynamic(
  () => import('@/components/PointCloudViewer'),
  { ssr: false },
);

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <Navbar />
      <Hero />
      <div className="px-4">
        <PointCloudViewer />
      </div>
      <Progress />
      <Features />
      <Contact />
      <Sponsors />
      <Footer />
    </>
  );
};

export default IndexPage;
