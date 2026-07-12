import { notFound } from 'next/navigation';
import { getContentItem, ArticleView } from '@/lib/content';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const item = await getContentItem(id);
  return {
    title: item ? `${item.title} — Revista Going` : 'Revista Going',
    description: item?.summary ?? 'Artículo de la Revista Going.',
  };
}

export default async function RevistaDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getContentItem(id);
  if (!item) notFound();
  return <ArticleView item={item} backHref="/revista" backLabel="Revista" />;
}
