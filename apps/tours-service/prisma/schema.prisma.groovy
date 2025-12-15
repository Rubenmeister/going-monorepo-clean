// Modelo de Prisma para el Tours-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") 
}

model Tour {
  id                String     @id @default(uuid()) @db.Uuid
  hostId            String     @db.Uuid
  title             String
  description       String
  category          String
  durationInHours   Float
  priceAmount       Float      // price.amount en Mongoose
  locationCity      String
  status            String     @default("draft") // 'published', 'draft', etc.
  
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([hostId])
  @@index([category])
  @@index([locationCity])
  @@index([status])
}