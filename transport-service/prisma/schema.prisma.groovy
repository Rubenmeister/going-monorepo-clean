// Modelo de Prisma para el Transport-Service
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client" 
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") 
}

model Route {
  id          String     @id @default(uuid()) @db.Uuid
  name        String     @unique // Nombre descriptivo de la ruta (ej: 'Aeropuerto - Centro')
  description String
  basePrice   Float      // Precio base del servicio (usamos Float/Decimal para dinero)
  capacity    Int        // Capacidad máxima de pasajeros o vehículos
  status      String     @default("active") // 'active', 'inactive', 'maintenance'
  
  // Opcional: Coordenadas o referencias a ubicaciones específicas si el dominio lo requiere
  // startLocationId String?
  // endLocationId   String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}