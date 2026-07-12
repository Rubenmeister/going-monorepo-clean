import { notFound } from 'next/navigation';
import { getContentItem, ArticleView } from '@/lib/content';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await getContentItem(slug);
  return {
    title: item ? `${item.title} — Blog Going App` : 'Blog Going App',
    description: item?.summary ?? 'Artículo del blog de Going App.',
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const item = await getContentItem(slug);
  if (!item) notFound();
  return <ArticleView item={item} backHref="/blog" backLabel="Blog" />;
}
