// Modelo de Prisma para el Booking-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Debe ser BOOKING_DB_URL o similar
}

model Booking {
  id           String    @id @default(uuid()) @db.Uuid
  userId       String    @db.Uuid // Referencia al User (Dominio Externo)
  experienceId String    @db.Uuid // Referencia a Experience (Dominio Externo)
  startDate    DateTime
  endDate      DateTime
  totalPrice   Float     // Usamos Float/Decimal para precios
  status       String    @default("pending") // Mapea al tipo BookingStatus
  paymentId    String?   @unique // Puede ser null, pero si existe es único
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // Podrías añadir índices para búsquedas rápidas por userId o experienceId
  @@index([userId])
  @@index([experienceId])
}