import { notFound } from 'next/navigation';
import { getContentItem, ArticleView } from '@/lib/content';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const item = await getContentItem(id);
  return {
    title: item ? `${item.title} — Noticias Going App` : 'Noticias Going App',
    description: item?.summary ?? 'Noticia de Going App Ecuador.',
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getContentItem(id);
  if (!item) notFound();
  return <ArticleView item={item} backHref="/news" backLabel="Noticias" />;
}
