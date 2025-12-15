// Modelo de Prisma para el Experiencias-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") 
}

model Experience {
  id                String     @id @default(uuid()) @db.Uuid
  hostId            String     @db.Uuid // ID del Anfitrión (Host)
  title             String
  description       String
  pricePerPerson    Float      // Usamos Float/Decimal para precios
  maxCapacity       Int
  location          String     // Podría evolucionar a JSONB para coordenadas
  status            String     @default("draft") // 'draft', 'published', 'archived'
  
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([hostId])
  @@index([status])
  @@index([location])
}