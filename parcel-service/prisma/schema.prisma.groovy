// Modelo de Prisma para el Envios-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") 
}

model Shipment {
  id                String     @id @default(uuid()) @db.Uuid
  userId            String     @db.Uuid
  driverId          String?    @db.Uuid // Puede ser null
  pickupAddress     String
  deliveryAddress   String
  weight            Float
  price             Float
  status            String     @default("pending") // 'pending', 'accepted', 'delivered', etc.
  
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([userId])
  @@index([driverId])
  @@index([status])
}