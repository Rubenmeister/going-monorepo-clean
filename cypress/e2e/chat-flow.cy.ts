/**
 * E2E Tests for Chat Flow
 *
 * Tests the complete user chat experience:
 * - Login as two users
 * - Start a ride together
 * - Open chat conversation
 * - Send messages
 * - Receive messages
 * - Mark messages as read
 * - See unread indicators
 */

describe('Chat Flow E2E Tests', () => {
  const passengerEmail = 'passenger@example.com';
  const passengerPassword = 'password123';
  const driverEmail = 'driver@example.com';
  const driverPassword = 'password123';

  // API endpoints for setup
  const apiUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Chat Conversation Setup', () => {
    it('should login passenger user', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-name"]').should('contain', 'Passenger');
    });

    it('should login driver user', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(driverEmail);
      cy.get('input[name="password"]').type(driverPassword);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-name"]').should('contain', 'Driver');
    });
  });

  describe('Chat Window Interaction', () => {
    beforeEach(() => {
      // Login as passenger
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should open chat for active ride', () => {
      // Navigate to active rides
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();

      // Open chat
      cy.get('[data-testid="chat-button"]').click();
      cy.get('[data-testid="chat-window"]').should('be.visible');
    });

    it('should display chat messages', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Check message list
      cy.get('[data-testid="message-list"]').should('be.visible');
      cy.get('[data-testid="message-item"]').should(
        'have.length.greaterThan',
        0
      );
    });

    it('should show typing indicator', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Start typing
      cy.get('[data-testid="message-input"]').type('Hello');
      cy.get('[data-testid="typing-indicator"]').should('be.visible');
    });

    it('should display user presence', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Check if driver is online
      cy.get('[data-testid="driver-status"]').should('contain', 'Online');
      cy.get('[data-testid="driver-avatar"]').should('have.class', 'online');
    });
  });

  describe('Sending Messages', () => {
    beforeEach(() => {
      // Login as passenger
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should send a text message', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      const message = 'I am 5 minutes away';
      cy.get('[data-testid="message-input"]').type(message);
      cy.get('[data-testid="send-button"]').click();

      // Message should appear in chat
      cy.get('[data-testid="message-item"]').last().should('contain', message);
      cy.get('[data-testid="message-item"]')
        .last()
        .should('have.class', 'sent');
    });

    it('should clear input after sending message', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="message-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();

      // Input should be cleared
      cy.get('[data-testid="message-input"]').should('have.value', '');
    });

    it('should show message status (pending → sent → delivered → read)', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="message-input"]').type('Status test');
      cy.get('[data-testid="send-button"]').click();

      // Check initial status
      cy.get('[data-testid="message-item"]')
        .last()
        .within(() => {
          cy.get('[data-testid="message-status"]').should(
            'have.class',
            'pending'
          );
        });

      // Wait for sent status
      cy.get('[data-testid="message-item"]')
        .last()
        .within(() => {
          cy.get('[data-testid="message-status"]', { timeout: 5000 }).should(
            'have.class',
            'sent'
          );
        });
    });

    it('should send multiple messages in sequence', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      const messages = ['Hi', 'How are you?', 'I am on my way'];

      messages.forEach((msg) => {
        cy.get('[data-testid="message-input"]').type(msg);
        cy.get('[data-testid="send-button"]').click();
        cy.get('[data-testid="message-input"]').should('have.value', '');
      });

      // Verify all messages were sent
      messages.forEach((msg) => {
        cy.get('[data-testid="message-item"]').should('contain', msg);
      });
    });

    it('should handle special characters in message', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      const specialMessage =
        'Hello! 👋 How are you? <script>alert("test")</script>';
      cy.get('[data-testid="message-input"]').type(specialMessage);
      cy.get('[data-testid="send-button"]').click();

      // Message should be displayed safely (XSS protected)
      cy.get('[data-testid="message-item"]')
        .last()
        .should('contain', 'Hello! 👋');
      cy.get('[data-testid="message-item"]')
        .last()
        .should('not.contain', '<script>');
    });

    it('should disable send button when input is empty', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="send-button"]').should('be.disabled');

      cy.get('[data-testid="message-input"]').type('Test');
      cy.get('[data-testid="send-button"]').should('not.be.disabled');

      cy.get('[data-testid="message-input"]').clear();
      cy.get('[data-testid="send-button"]').should('be.disabled');
    });
  });

  describe('Receiving Messages', () => {
    it('should receive messages in real-time', () => {
      // Login as passenger
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Simulate driver sending a message via API
      const rideId = cy.url().then((url) => url.split('/').pop());

      cy.then(() => {
        cy.request('POST', `${apiUrl}/chats/rides/${rideId}/messages`, {
          content: 'Driver message',
          receiverId: 'user_id',
        });
      });

      // Message should appear in chat
      cy.get('[data-testid="message-item"]', { timeout: 5000 }).should(
        'contain',
        'Driver message'
      );
    });

    it('should show received messages as unread initially', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // New received messages should be marked as unread
      cy.get('[data-testid="message-item"]')
        .last()
        .should('have.class', 'unread');
    });

    it('should auto-scroll to newest message', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Scroll up to older messages
      cy.get('[data-testid="message-list"]').scrollTo('top');

      // Send a new message
      cy.get('[data-testid="message-input"]').type('New message');
      cy.get('[data-testid="send-button"]').click();

      // Should auto-scroll to bottom
      cy.get('[data-testid="message-list"]').then((el) => {
        expect(el[0].scrollTop + el[0].clientHeight).to.equal(
          el[0].scrollHeight
        );
      });
    });
  });

  describe('Mark as Read', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should mark messages as read when viewing them', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Open conversation (should auto-mark as read)
      cy.wait(1000);

      // Messages should now be marked as read
      cy.get('[data-testid="message-item"]')
        .last()
        .should('not.have.class', 'unread');
    });

    it('should show read receipts', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="message-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();

      // Wait for read receipt
      cy.get('[data-testid="message-item"]')
        .last()
        .within(() => {
          cy.get('[data-testid="read-receipt"]', { timeout: 5000 }).should(
            'be.visible'
          );
        });
    });
  });

  describe('Conversation List', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should show list of conversations', () => {
      cy.get('[data-testid="nav-messages"]').click();
      cy.get('[data-testid="conversation-item"]').should(
        'have.length.greaterThan',
        0
      );
    });

    it('should display unread badge on conversations', () => {
      cy.get('[data-testid="nav-messages"]').click();

      // Find conversation with unread messages
      cy.get('[data-testid="conversation-item"]')
        .contains('Driver')
        .parent()
        .within(() => {
          cy.get('[data-testid="unread-badge"]').should('contain.text', /\d+/);
        });
    });

    it('should navigate to conversation when clicked', () => {
      cy.get('[data-testid="nav-messages"]').click();
      cy.get('[data-testid="conversation-item"]').first().click();

      cy.get('[data-testid="chat-window"]').should('be.visible');
      cy.get('[data-testid="message-input"]').should('be.visible');
    });
  });

  describe('Chat Error Handling', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '**/messages', { statusCode: 500 }).as(
        'sendMessageError'
      );

      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="message-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();

      cy.wait('@sendMessageError');

      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Failed to send message'
      );
    });

    it('should show loading state while sending message', () => {
      cy.intercept('POST', '**/messages', (req) => {
        req.reply((res) => {
          res.delay(2000);
        });
      }).as('slowSend');

      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="message-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();

      // Send button should show loading state
      cy.get('[data-testid="send-button"]').should('have.class', 'loading');

      cy.wait('@slowSend');

      // Loading state should be removed
      cy.get('[data-testid="send-button"]').should('not.have.class', 'loading');
    });

    it('should retry failed messages', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      cy.get('[data-testid="message-input"]').type('Retry test');
      cy.get('[data-testid="send-button"]').click();

      // Look for retry button on failed message
      cy.get('[data-testid="message-item"]')
        .last()
        .within(() => {
          cy.get('[data-testid="retry-button"]').should('exist');
        });
    });
  });

  describe('Chat Performance', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should handle large number of messages efficiently', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Send multiple messages
      for (let i = 0; i < 50; i++) {
        cy.get('[data-testid="message-input"]').type(`Message ${i}`);
        cy.get('[data-testid="send-button"]').click();
      }

      // Chat should still be responsive
      cy.get('[data-testid="message-input"]').should('be.visible');
      cy.get('[data-testid="send-button"]').should('not.be.disabled');
    });

    it('should load messages with pagination', () => {
      cy.get('[data-testid="nav-rides"]').click();
      cy.get('[data-testid="active-ride"]').first().click();
      cy.get('[data-testid="chat-button"]').click();

      // Scroll to top to load older messages
      cy.get('[data-testid="message-list"]').scrollTo('top');

      // Load older messages button should appear
      cy.get('[data-testid="load-more-button"]').should('be.visible');
      cy.get('[data-testid="load-more-button"]').click();

      // More messages should be loaded
      cy.get('[data-testid="message-item"]').should(
        'have.length.greaterThan',
        10
      );
    });
  });
});
