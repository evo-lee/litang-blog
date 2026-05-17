import type { Metadata } from 'next';
import { CoverPlaceholder, pickCoverColor } from '@/components/site/CoverPlaceholder';
import { StructuredData } from '@/components/seo/StructuredData';
import { getLocaleMessages } from '@/lib/i18n/messages';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildCollectionPageStructuredData } from '@/lib/seo/structured-data';

const PORTFOLIO_PLACEHOLDERS = [
  { id: 'evonote', title: 'EvoNote', summary: '一个为公开学习设计的笔记产品' },
  { id: 'weather', title: '极简天气', summary: '一个有意做减法的 Web App' },
  { id: 'reads', title: '读书笔记站', summary: '面向自己的阅读卡片库' },
];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getRequestLocale(searchParams);
  const messages = getLocaleMessages(locale);
  return buildPageMetadata({
    path: locale === 'zh-CN' ? '/projects' : `/${locale}/projects`,
    title: messages.projects.title,
    description: messages.projects.description,
  });
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale(searchParams);
  const messages = getLocaleMessages(locale);

  return (
    <main className="container page-shell">
      <StructuredData
        data={buildCollectionPageStructuredData({
          title: messages.projects.title,
          description: messages.projects.description,
          path: locale === 'zh-CN' ? '/projects' : `/${locale}/projects`,
        })}
      />
      <header className="page-header">
        <h1 className="page-header__title">{messages.projects.title}</h1>
        <p className="page-header__sub">{messages.projects.description}</p>
      </header>

      <div className="works-grid">
        {PORTFOLIO_PLACEHOLDERS.map((work) => (
          <div key={work.id} className="work-card">
            <div
              className="work-card__cover work-card__cover--lg"
              style={{ background: pickCoverColor(work.id) }}
            >
              <CoverPlaceholder color={pickCoverColor(work.id)} label="project" />
            </div>
            <div className="work-card__body">
              <p className="work-card__title">{work.title}</p>
              <p className="work-card__status">{messages.projects.status}</p>
              <p className="post-card__excerpt" style={{ marginTop: 8 }}>
                {work.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
