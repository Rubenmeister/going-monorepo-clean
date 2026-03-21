# Phase 5: Module Wiring & Setup

This guide explains how to integrate Phase 5 (Messaging & Chat) modules into your NestJS application.

## Quick Setup

### 1. Import Modules in App

**For Notifications Service** (`notifications-service/src/app.module.ts`):

```typescript
import { MessagingModule } from './messaging.module';

@Module({
  imports: [
    // ... other modules
    MessagingModule, // Phase 5 Messaging & Chat
  ],
})
export class AppModule {}
```

**For Transport Service** (`transport-service/src/app.module.ts`):

```typescript
import { RideMatchingModule } from './matching.module';

@Module({
  imports: [
    // ... other modules
    RideMatchingModule, // Phase 5 Ride Matching
  ],
})
export class AppModule {}
```

### 2. Configure Environment Variables

Create/update `.env.development`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/going-platform-dev

# Firebase (Optional - uses mock mode if not provided)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-key.json

# Twilio (Optional - uses mock mode if not provided)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Optional - uses mock mode if not provided)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@going-platform.com

# Socket.IO
SOCKET_IO_HOST=localhost
SOCKET_IO_PORT=3001
```

### 3. Run Database Migrations

```bash
# Install migrate-mongo
npm install -g migrate-mongo

# Initialize migration config (first time only)
migrate-mongo init

# Run all pending migrations
migrate-mongo up

# Verify collections created
mongo
  > use going-platform-dev
  > db.getCollectionNames()
```

### 4. Update Controllers

Controllers are now wired with use cases via dependency injection.

**Chat Controller** (`notifications-service/src/api/chat.controller.ts`):

```typescript
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getConversationUseCase: GetConversationUseCase,
    private readonly markReadUseCase: MarkMessageAsReadUseCase,
    private readonly getOnlineUsersUseCase: GetOnlineUsersUseCase
  ) {}

  @Post('rides/:rideId/messages')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('rideId') rideId: string,
    @Body() dto: SendMessageDto
  ) {
    return this.sendMessageUseCase.execute({
      rideId: rideId as UUID,
      senderId: user.id as UUID,
      receiverId: dto.receiverId as UUID,
      content: dto.content,
      messageType: dto.messageType,
    });
  }

  // ... implement other endpoints
}
```

**Ride Controller** (`transport-service/src/api/ride.controller.ts`):

```typescript
@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RideController {
  constructor(
    private readonly matchDriversUseCase: MatchAvailableDriversUseCase,
    private readonly acceptMatchUseCase: AcceptRideMatchUseCase,
    private readonly rejectMatchUseCase: RejectRideMatchUseCase
  ) {}

  @Post(':rideId/request-matching')
  async requestMatching(
    @Param('rideId') rideId: string,
    @Body() dto: RequestRideMatchingDto
  ) {
    return this.matchDriversUseCase.execute({
      rideId: rideId as UUID,
      ...dto,
    });
  }

  // ... implement other endpoints
}
```

## Module Dependencies

### MessagingModule Provides:

- `SendMessageUseCase` - Send chat messages
- `GetConversationUseCase` - Fetch chat history
- `MarkMessageAsReadUseCase` - Mark messages as read
- `GetOnlineUsersUseCase` - Get active users
- `SendNotificationUseCase` - Send notifications (all channels)
- `IMessageRepository` - MongoDB message persistence
- `IChatGateway` - WebSocket broadcasting
- `INotificationGateway` - Multi-channel notifications

### RideMatchingModule Provides:

- `MatchAvailableDriversUseCase` - Find nearby drivers
- `AcceptRideMatchUseCase` - Driver accepts ride
- `RejectRideMatchUseCase` - Driver rejects ride
- `IRideMatchRepository` - MongoDB match persistence
- `RideDispatchGateway` - Real-time ride updates

## WebSocket Setup

The `ChatGateway` is automatically registered with Socket.IO when the module is imported.

**Connect from Frontend**:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: bearerToken,
  },
});

// Join ride chat room
socket.emit('chat:join', { rideId: 'ride_123', userId: 'user_456' });

// Send message
socket.emit('chat:message:send', {
  rideId: 'ride_123',
  messageId: 'msg_abc',
  senderId: 'user_456',
  receiverId: 'user_789',
  content: 'Hello!',
});

// Listen for new messages
socket.on('chat:message:received', (message) => {
  console.log('New message:', message);
});
```

## Testing

Run tests with full module setup:

```bash
# Unit tests
npm run test -- --testPathPattern="send-message.use-case"

# Run all Phase 5 tests
npm run test -- --testPathPattern="phase-5|messaging|matching"

# With coverage
npm run test -- --coverage
```

## Production Deployment

### Pre-deployment Checklist:

- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] Tests passing (90%+ coverage)
- [ ] Load testing completed
- [ ] Monitoring configured (Sentry)

### Deployment Steps:

1. **Run migrations**:

   ```bash
   npm run migration:up
   ```

2. **Start services**:

   ```bash
   npm run start:notifications-service
   npm run start:transport-service
   ```

3. **Verify health checks**:

   ```bash
   curl http://localhost:3000/health
   ```

4. **Monitor logs**:
   ```bash
   npm run logs
   ```

## Troubleshooting

### Module Import Errors

**Error**: `Cannot find module '@going-monorepo-clean/domains-notification-application'`

**Solution**: Ensure the import path is correct and the library is built:

```bash
npx nx build domains-notification-core
npx nx build domains-notification-application
npx nx build domains-transport-core
npx nx build domains-transport-application
```

### WebSocket Connection Failures

**Check**:

1. Socket.IO is listening on correct port
2. CORS is configured for client domain
3. JWT token is valid
4. Network firewall allows WebSocket connections

### Database Connection Issues

**Check**:

1. MongoDB is running
2. `MONGODB_URI` is correct
3. Database user has permissions
4. Network connectivity to MongoDB

### Gateway Initialization Issues

**Check**:

1. Optional gateways use mock mode by default
2. Credentials are in environment variables
3. Logs show initialization status

## Next Steps

1. Implement remaining controller endpoints
2. Add integration tests for full workflows
3. Configure production monitoring (Sentry, DataDog)
4. Set up load testing (k6, locust)
5. Deploy to staging environment

## Related Files

- `notifications-service/src/messaging.module.ts`
- `transport-service/src/matching.module.ts`
- `migrations/` - Database migration scripts
- `PHASE5_PROGRESS.md` - Overall phase status
- `PHASE5_MESSAGING_PLAN.md` - Detailed implementation plan
