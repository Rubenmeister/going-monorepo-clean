// Modelo de Prisma para el Notifications-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") 
}

model Notification {
  id                String     @id @default(uuid()) @db.Uuid
  recipient         String     // Email, número de teléfono, etc.
  type              String     // 'email', 'sms', 'push'
  subject           String     // Asunto o título del mensaje
  status            String     @default("queued") // 'sent', 'failed', 'queued'
  relatedEntityId   String     @db.Uuid // ID de Booking, User, o la entidad que disparó la notificación
  sentAt            DateTime   @default(now())
  failureReason     String?    // Razón del fallo, si aplica

  @@index([relatedEntityId])
  @@index([recipient])
}