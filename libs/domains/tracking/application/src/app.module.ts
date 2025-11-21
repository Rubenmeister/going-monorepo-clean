// apps/tracking-service/src/app.module.ts

import {
  UpdateLocationUseCase,
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-application'; // <-- RUTA CORRECTA (Libs)
// ...
@Module({
  // ...
  providers: [
    TrackingGateway, 
    UpdateLocationUseCase,
    GetActiveDriversUseCase,
  ],
})
export class AppModule {}