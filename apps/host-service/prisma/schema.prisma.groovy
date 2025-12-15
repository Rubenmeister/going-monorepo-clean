// Modelo de Prisma para el Anfitriones-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") 
}

model Host {
  id                    String     @id @default(uuid()) @db.Uuid
  userId                String     @unique @db.Uuid // Referencia única al usuario asociado
  companyName           String
  verificationStatus    String     @default("pending") // 'pending', 'verified', 'rejected'
  bio                   String
  documentId            String?    // ID del documento de verificación
  
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  @@index([userId])
  @@index([verificationStatus])
}