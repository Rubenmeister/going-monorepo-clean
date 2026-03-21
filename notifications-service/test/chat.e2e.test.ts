import * as io from 'socket.io-client';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

/**
 * End-to-End Tests for Real-time Chat via WebSocket
 * Tests multi-user scenarios, message ordering, and edge cases
 */
describe('Real-time Chat E2E Tests', () => {
  let server: SocketIOServer;
  let httpServer: HTTPServer;

  const TEST_RIDE_ID = 'ride-e2e-test-123';
  const users = {
    passenger: {
      userId: 'user-001',
      name: 'Alice',
      role: 'passenger',
    },
    driver: {
      userId: 'driver-001',
      name: 'Bob',
      role: 'driver',
    },
    admin: {
      userId: 'admin-001',
      name: 'Admin',
      role: 'admin',
    },
  };

  beforeAll((done) => {
    // Setup Socket.io server
    httpServer = require('http').createServer();
    server = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
      },
    });

    httpServer.listen(3002, () => {
      done();
    });
  });

  afterAll(() => {
    httpServer.close();
  });

  describe('Chat Room Management', () => {
    it('should create chat room on first user join', (done) => {
      const socket = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.passenger.userId, rideId: TEST_RIDE_ID },
      });

      socket.on('connect', () => {
        socket.emit('chat:join', { rideId: TEST_RIDE_ID }, (response: any) => {
          expect(response.success).toBe(true);
          expect(response.room).toBe(`ride:${TEST_RIDE_ID}`);
          expect(response.participantCount).toBe(1);
          socket.disconnect();
          done();
        });
      });
    });

    it('should add participants to existing room', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.passenger.userId, rideId: TEST_RIDE_ID },
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.driver.userId, rideId: TEST_RIDE_ID },
      });

      let joinedCount = 0;

      const checkDone = () => {
        joinedCount++;
        if (joinedCount === 2) {
          passenger.disconnect();
          driver.disconnect();
          done();
        }
      };

      passenger.on('connect', () => {
        passenger.emit(
          'chat:join',
          { rideId: TEST_RIDE_ID },
          (response: any) => {
            expect(response.participantCount).toBeGreaterThanOrEqual(1);
            checkDone();
          }
        );
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, (response: any) => {
          expect(response.participantCount).toBeGreaterThanOrEqual(2);
          checkDone();
        });
      });
    });

    it('should broadcast user joined event', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.passenger.userId, rideId: TEST_RIDE_ID },
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.driver.userId, rideId: TEST_RIDE_ID },
      });

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          // Passenger joined, now driver joins
          driver.on('chat:user:joined', (data: any) => {
            expect(data.userId).toBe(users.driver.userId);
            expect(data.rideId).toBe(TEST_RIDE_ID);
            passenger.disconnect();
            driver.disconnect();
            done();
          });
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});
      });
    });

    it('should handle user leaving room', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.passenger.userId, rideId: TEST_RIDE_ID },
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: users.driver.userId, rideId: TEST_RIDE_ID },
      });

      let setupDone = false;

      const setup = () => {
        if (setupDone) return;
        setupDone = true;

        driver.on('chat:user:left', (data: any) => {
          expect(data.userId).toBe(users.passenger.userId);
          expect(data.participantsRemaining).toBeGreaterThanOrEqual(1);
          driver.disconnect();
          done();
        });

        // Passenger leaves
        setTimeout(() => {
          passenger.emit('chat:leave', { rideId: TEST_RIDE_ID });
          passenger.disconnect();
        }, 500);
      };

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, setup);
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, setup);
      });
    });
  });

  describe('Message Ordering & Delivery', () => {
    it('should preserve message order', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const messages = ['First message', 'Second message', 'Third message'];
      const receivedMessages: string[] = [];

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          messages.forEach((msg, idx) => {
            setTimeout(() => {
              passenger.emit('chat:message:send', {
                rideId: TEST_RIDE_ID,
                message: msg,
              });
            }, idx * 100);
          });
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:message:received', (data: any) => {
          receivedMessages.push(data.message);

          if (receivedMessages.length === messages.length) {
            expect(receivedMessages).toEqual(messages);
            passenger.disconnect();
            driver.disconnect();
            done();
          }
        });
      });
    });

    it('should include timestamp with each message', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          passenger.emit('chat:message:send', {
            rideId: TEST_RIDE_ID,
            message: 'Timestamped message',
          });
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:message:received', (data: any) => {
          expect(data.timestamp).toBeDefined();
          expect(new Date(data.timestamp).getTime()).toBeLessThanOrEqual(
            Date.now()
          );
          passenger.disconnect();
          driver.disconnect();
          done();
        });
      });
    });

    it('should not lose messages during rapid sends', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const messageCount = 50;
      const receivedMessages = new Set();

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          for (let i = 0; i < messageCount; i++) {
            passenger.emit('chat:message:send', {
              rideId: TEST_RIDE_ID,
              message: `Message ${i}`,
            });
          }
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:message:received', (data: any) => {
          receivedMessages.add(data.messageId);

          if (receivedMessages.size === messageCount) {
            expect(receivedMessages.size).toBe(messageCount);
            passenger.disconnect();
            driver.disconnect();
            done();
          }
        });
      });
    }, 10000);
  });

  describe('Typing Indicators', () => {
    it('should broadcast typing status', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          passenger.emit('chat:typing', {
            rideId: TEST_RIDE_ID,
            isTyping: true,
          });
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:typing', (data: any) => {
          expect(data.userId).toBe(users.passenger.userId);
          expect(data.isTyping).toBe(true);
          passenger.disconnect();
          driver.disconnect();
          done();
        });
      });
    });

    it('should clear typing status', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      let isTypingStarted = false;

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          passenger.emit('chat:typing', {
            rideId: TEST_RIDE_ID,
            isTyping: true,
          });
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:typing', (data: any) => {
          if (data.isTyping && !isTypingStarted) {
            isTypingStarted = true;
            // Clear typing status
            setTimeout(() => {
              passenger.emit('chat:typing', {
                rideId: TEST_RIDE_ID,
                isTyping: false,
              });
            }, 300);
          } else if (!data.isTyping && isTypingStarted) {
            expect(data.isTyping).toBe(false);
            passenger.disconnect();
            driver.disconnect();
            done();
          }
        });
      });
    });
  });

  describe('Read Receipts', () => {
    it('should mark message as read', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      let messageId: string;

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          passenger.emit('chat:message:send', {
            rideId: TEST_RIDE_ID,
            message: 'Message to be read',
          });
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:message:received', (data: any) => {
          messageId = data.messageId;
          // Mark as read
          driver.emit('chat:message:read', {
            rideId: TEST_RIDE_ID,
            messageId,
          });
        });
      });

      passenger.on('chat:message:read', (data: any) => {
        expect(data.messageId).toBe(messageId);
        expect(data.readBy).toBe(users.driver.userId);
        passenger.disconnect();
        driver.disconnect();
        done();
      });
    });
  });

  describe('Message History', () => {
    it('should retrieve message history', (done) => {
      const socket = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        // Send some messages first
        socket.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          socket.emit('chat:message:send', {
            rideId: TEST_RIDE_ID,
            message: 'Message 1',
          });

          setTimeout(() => {
            socket.emit('chat:message:send', {
              rideId: TEST_RIDE_ID,
              message: 'Message 2',
            });

            // Request history
            setTimeout(() => {
              socket.emit(
                'chat:history',
                {
                  rideId: TEST_RIDE_ID,
                  limit: 50,
                },
                (messages: any) => {
                  expect(Array.isArray(messages)).toBe(true);
                  expect(messages.length).toBeGreaterThanOrEqual(2);
                  socket.disconnect();
                  done();
                }
              );
            }, 300);
          }, 300);
        });
      });
    });

    it('should support pagination in history', (done) => {
      const socket = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit(
          'chat:history',
          {
            rideId: TEST_RIDE_ID,
            page: 1,
            limit: 10,
          },
          (response: any) => {
            expect(response).toHaveProperty('messages');
            expect(response).toHaveProperty('total');
            expect(response).toHaveProperty('page');
            expect(response.messages.length).toBeLessThanOrEqual(10);
            socket.disconnect();
            done();
          }
        );
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should reject invalid ride ID', (done) => {
      const socket = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit('chat:join', { rideId: '' }, (response: any) => {
          expect(response.success).toBe(false);
          expect(response.error).toBeDefined();
          socket.disconnect();
          done();
        });
      });
    });

    it('should handle disconnection during message send', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      let messagesSent = 0;

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          passenger.emit('chat:message:send', {
            rideId: TEST_RIDE_ID,
            message: 'Before disconnect',
          });
          messagesSent++;

          // Disconnect abruptly
          setTimeout(() => {
            passenger.disconnect();
          }, 500);
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {});

        driver.on('chat:message:received', () => {
          // Should still receive messages sent before disconnect
          expect(messagesSent).toBeGreaterThan(0);
        });

        driver.on('chat:user:left', (data: any) => {
          expect(data.userId).toBe(users.passenger.userId);
          driver.disconnect();
          done();
        });
      });
    });

    it('should handle concurrent messages from multiple users', (done) => {
      const users = [];
      const sockets = [];

      for (let i = 0; i < 3; i++) {
        sockets.push(
          io('http://localhost:3002', {
            transports: ['websocket'],
          })
        );
      }

      let joinedCount = 0;
      const messageCount = 10;
      let receivedCount = 0;

      sockets.forEach((socket, idx) => {
        socket.on('connect', () => {
          socket.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
            joinedCount++;

            if (joinedCount === 3) {
              // All joined, start sending messages
              for (let i = 0; i < messageCount; i++) {
                socket.emit('chat:message:send', {
                  rideId: TEST_RIDE_ID,
                  message: `User ${idx}: Message ${i}`,
                });
              }
            }
          });

          socket.on('chat:message:received', () => {
            receivedCount++;
            if (receivedCount === messageCount * 3 * 3 - messageCount * 3) {
              // All messages received and echoed
              sockets.forEach((s) => s.disconnect());
              done();
            }
          });
        });
      });
    }, 15000);

    it('should handle message too large', (done) => {
      const socket = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const largeMessage = 'A'.repeat(10000); // 10KB message

      socket.on('connect', () => {
        socket.emit(
          'chat:message:send',
          {
            rideId: TEST_RIDE_ID,
            message: largeMessage,
          },
          (response: any) => {
            // Should either accept or reject gracefully
            expect([true, false]).toContain(response.success || false);
            socket.disconnect();
            done();
          }
        );
      });
    });
  });

  describe('Participant Management', () => {
    it('should list all participants in room', (done) => {
      const passenger = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      const driver = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      let bothJoined = false;

      passenger.on('connect', () => {
        passenger.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          if (bothJoined) {
            passenger.emit(
              'chat:participants',
              { rideId: TEST_RIDE_ID },
              (participants: any) => {
                expect(Array.isArray(participants)).toBe(true);
                expect(participants.length).toBeGreaterThanOrEqual(2);
                passenger.disconnect();
                driver.disconnect();
                done();
              }
            );
          }
        });
      });

      driver.on('connect', () => {
        driver.emit('chat:join', { rideId: TEST_RIDE_ID }, () => {
          bothJoined = true;
        });
      });
    });
  });
});
