import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagingModule } from '../messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.NOTIFICATION_DB_URL ||
        process.env.MONGO_URL ||
        'mongodb://localhost:27017/notifications-db',
      {
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e) =>
            console.warn('MongoDB notifications:', e.message)
          );
          return conn;
        },
      }
    ),
    MessagingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
