generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String     @id @default(uuid()) @db.Uuid
  email             String     @unique
  passwordHash      String
  firstName         String
  lastName          String
  phone             String?    // Campo opcional
  roles             String[]   // Mapeado desde Role[]
  status            String     @default("pending_verification") // Mapeado de UserStatus
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt // Este campo es útil pero no existe en tu entidad
  verificationToken String?    // Campo opcional
}