/**
 * Going – Content Agent Types
 * Cubre: revista, blog, noticias, academia
 */

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type ContentType   = 'article' | 'blog_post' | 'news' | 'academy_lesson' | 'academy_course';
export type ContentLang   = 'es' | 'en';

export interface ContentItem {
  id:          string;
  type:        ContentType;
  title:       string;
  body:        string;
  summary:     string;
  author:      string;
  status:      ContentStatus;
  lang:        ContentLang;
  tags:        string[];
  category:    string;
  coverImage?: string;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface AcademyCourse {
  id:          string;
  title:       string;
  description: string;
  lessons:     AcademyLesson[];
  targetRole:  'driver' | 'host' | 'guide' | 'operator' | 'all';
  status:      ContentStatus;
  createdAt:   string;
  updatedAt:   string;
}

export interface AcademyLesson {
  id:       string;
  courseId: string;
  order:    number;
  title:    string;
  body:     string;
  duration: number;   // minutos
  quiz?:    QuizQuestion[];
  status:   ContentStatus;
}

export interface QuizQuestion {
  question: string;
  options:  string[];
  correct:  number;   // índice de la opción correcta
}

export interface ContentAlert {
  type:      'overdue_review' | 'scheduled_soon' | 'academy_incomplete' | 'low_content';
  severity:  'info' | 'warning' | 'critical';
  message:   string;
  itemId?:   string;
  createdAt: string;
}
