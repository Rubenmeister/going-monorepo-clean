import { Firestore, Timestamp } from '@google-cloud/firestore';
import { ContentItem, AcademyCourse, AcademyLesson, ContentAlert } from '../types/content.types';

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// ─── Contenido general (revista, blog, noticias) ──────────────

export async function getItemsPendingReview(olderThanHours = 48): Promise<ContentItem[]> {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - olderThanHours * 3600 * 1000));
  const snap = await db.collection('content_items')
    .where('status', '==', 'draft')
    .where('createdAt', '<=', cutoff)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem));
}

export async function getScheduledItems(withinHours = 24): Promise<ContentItem[]> {
  const now    = Timestamp.now();
  const cutoff = Timestamp.fromDate(new Date(Date.now() + withinHours * 3600 * 1000));
  const snap = await db.collection('content_items')
    .where('status', '==', 'approved')
    .where('scheduledAt', '>=', now)
    .where('scheduledAt', '<=', cutoff)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem));
}

export async function getPublishedThisWeek(): Promise<ContentItem[]> {
  const weekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 86400 * 1000));
  const snap = await db.collection('content_items')
    .where('status', '==', 'published')
    .where('publishedAt', '>=', weekAgo)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem));
}

export async function getContentByType(type: ContentItem['type']): Promise<ContentItem[]> {
  const snap = await db.collection('content_items')
    .where('type', '==', type)
    .where('status', 'in', ['draft', 'review', 'approved'])
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem));
}

export async function saveContentItem(item: Omit<ContentItem, 'id'>): Promise<string> {
  const ref = await db.collection('content_items').add(item);
  return ref.id;
}

// ─── Academia Going ───────────────────────────────────────────

export async function getIncompleteCourses(): Promise<AcademyCourse[]> {
  const snap = await db.collection('academy_courses')
    .where('status', 'in', ['draft', 'review'])
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyCourse));
}

export async function getCourseLessons(courseId: string): Promise<AcademyLesson[]> {
  const snap = await db.collection('academy_lessons')
    .where('courseId', '==', courseId)
    .orderBy('order', 'asc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyLesson));
}

export async function saveAcademyLesson(lesson: Omit<AcademyLesson, 'id'>): Promise<string> {
  const ref = await db.collection('academy_lessons').add(lesson);
  return ref.id;
}

// ─── Alertas ──────────────────────────────────────────────────

export async function saveContentAlert(alert: ContentAlert): Promise<void> {
  await db.collection('content_alerts').add(alert);
}
