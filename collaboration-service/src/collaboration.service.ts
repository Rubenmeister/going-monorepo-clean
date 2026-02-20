/**
 * Real-time Collaboration Service
 * Live chat, video conferencing, collaborative tools, and notifications hub
 */

import { Injectable, Logger } from '@nestjs/common';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  userId: string;
  content: string;
  attachments?: {
    type: 'IMAGE' | 'FILE' | 'VIDEO';
    url: string;
  }[];
  mentions?: string[]; // User IDs mentioned
  reactions?: { emoji: string; userIds: string[] }[];
  edited: boolean;
  editedAt?: Date;
  createdAt: Date;
}

export interface ChatConversation {
  id?: string;
  participants: string[];
  type: 'DIRECT' | 'GROUP' | 'SUPPORT' | 'DELIVERY';
  name?: string;
  description?: string;
  avatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>; // userId -> count
  pinnedMessages?: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  createdAt: Date;
  updatedAt?: Date;
}

export interface VideoSession {
  id?: string;
  initiatorId: string;
  participantId: string;
  type: 'CALL' | 'GROUP_CALL' | 'SCREEN_SHARE';
  status: 'INITIATED' | 'RINGING' | 'ACTIVE' | 'ENDED' | 'MISSED';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // seconds
  recordingUrl?: string;
  createdAt: Date;
}

export interface VideoParticipant {
  userId: string;
  sessionId: string;
  joinedAt: Date;
  leftAt?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'MESSAGE' | 'CALL' | 'DELIVERY' | 'SYSTEM' | 'REMINDER' | 'ALERT';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  channels: ('PUSH' | 'EMAIL' | 'SMS' | 'IN_APP')[];
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationPreference {
  id?: string;
  userId: string;
  notificationType: string;
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
}

export interface CollaborationActivity {
  id?: string;
  userId: string;
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'SHARED' | 'COMMENTED';
  resourceType: string;
  resourceId: string;
  description: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface DocumentShare {
  id?: string;
  documentId: string;
  ownerId: string;
  sharedWith: {
    userId: string;
    permission: 'VIEW' | 'COMMENT' | 'EDIT';
  }[];
  type: 'DELIVERY_DETAILS' | 'INVOICE' | 'CONTRACT' | 'REPORT';
  createdAt: Date;
  expiresAt?: Date;
}

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  // In-memory storage
  private conversations: Map<string, ChatConversation> = new Map();
  private messages: Map<string, ChatMessage> = new Map();
  private videoSessions: Map<string, VideoSession> = new Map();
  private videoParticipants: VideoParticipant[] = [];
  private notifications: Map<string, Notification> = new Map();
  private notificationPreferences: Map<string, NotificationPreference> =
    new Map();
  private activities: CollaborationActivity[] = [];
  private documentShares: Map<string, DocumentShare> = new Map();

  /**
   * Create or get conversation
   */
  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    type: ChatConversation['type'] = 'DIRECT'
  ): Promise<ChatConversation> {
    try {
      // Check if conversation already exists
      let conversation = Array.from(this.conversations.values()).find(
        (c) =>
          c.type === type &&
          c.participants.includes(userId) &&
          c.participants.includes(otherUserId)
      );

      if (conversation) {
        return conversation;
      }

      // Create new conversation
      const conversationId = `conv-${Date.now()}`;
      conversation = {
        id: conversationId,
        participants: [userId, otherUserId],
        type,
        unreadCount: {
          [userId]: 0,
          [otherUserId]: 0,
        },
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      this.conversations.set(conversationId, conversation);
      this.logger.log(`💬 Conversation created: ${conversationId}`);

      return conversation;
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error}`);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    attachments?: any[]
  ): Promise<ChatMessage> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new Error('User not part of conversation');
      }

      const messageId = `msg-${Date.now()}`;
      const message: ChatMessage = {
        id: messageId,
        conversationId,
        userId,
        content,
        attachments,
        edited: false,
        createdAt: new Date(),
      };

      this.messages.set(messageId, message);
      conversation.lastMessage = message;
      conversation.updatedAt = new Date();

      // Mark as unread for other participants
      conversation.participants.forEach((participantId) => {
        if (participantId !== userId) {
          conversation.unreadCount[participantId] =
            (conversation.unreadCount[participantId] || 0) + 1;
        }
      });

      this.logger.log(
        `📨 Message sent: ${conversationId} (${content.substring(0, 30)}...)`
      );

      return message;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<ChatMessage[]> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        throw new Error('Access denied');
      }

      const messages = Array.from(this.messages.values())
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(offset, offset + limit);

      // Mark as read
      conversation.unreadCount[userId] = 0;

      return messages;
    } catch (error) {
      this.logger.error(`Failed to get messages: ${error}`);
      throw error;
    }
  }

  /**
   * React to message
   */
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<ChatMessage | null> {
    try {
      const message = this.messages.get(messageId);
      if (!message) return null;

      if (!message.reactions) {
        message.reactions = [];
      }

      let reaction = message.reactions.find((r) => r.emoji === emoji);
      if (!reaction) {
        reaction = { emoji, userIds: [] };
        message.reactions.push(reaction);
      }

      if (!reaction.userIds.includes(userId)) {
        reaction.userIds.push(userId);
      }

      this.logger.log(`😊 Reaction added: ${emoji} to ${messageId}`);

      return message;
    } catch (error) {
      this.logger.error(`Failed to add reaction: ${error}`);
      throw error;
    }
  }

  /**
   * Initiate video call
   */
  async initiateVideoCall(
    initiatorId: string,
    participantId: string,
    type: VideoSession['type'] = 'CALL'
  ): Promise<VideoSession> {
    try {
      const sessionId = `session-${Date.now()}`;
      const session: VideoSession = {
        id: sessionId,
        initiatorId,
        participantId,
        type,
        status: 'INITIATED',
        createdAt: new Date(),
      };

      this.videoSessions.set(sessionId, session);

      this.logger.log(
        `📞 Video call initiated: ${initiatorId} -> ${participantId}`
      );

      return session;
    } catch (error) {
      this.logger.error(`Failed to initiate video call: ${error}`);
      throw error;
    }
  }

  /**
   * Join video session
   */
  async joinVideoSession(
    sessionId: string,
    userId: string
  ): Promise<VideoSession | null> {
    try {
      const session = this.videoSessions.get(sessionId);
      if (!session) return null;

      if (session.status === 'INITIATED') {
        session.status = 'ACTIVE';
        session.startTime = new Date();
      }

      const participant: VideoParticipant = {
        userId,
        sessionId,
        joinedAt: new Date(),
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false,
      };

      this.videoParticipants.push(participant);

      this.logger.log(`📹 User joined video session: ${userId}`);

      return session;
    } catch (error) {
      this.logger.error(`Failed to join video session: ${error}`);
      throw error;
    }
  }

  /**
   * Leave video session
   */
  async leaveVideoSession(
    sessionId: string,
    userId: string
  ): Promise<VideoSession | null> {
    try {
      const session = this.videoSessions.get(sessionId);
      if (!session) return null;

      const participant = this.videoParticipants.find(
        (p) => p.sessionId === sessionId && p.userId === userId
      );

      if (participant) {
        participant.leftAt = new Date();
      }

      const activeParticipants = this.videoParticipants.filter(
        (p) => p.sessionId === sessionId && !p.leftAt
      );

      if (activeParticipants.length === 0) {
        session.status = 'ENDED';
        session.endTime = new Date();
        if (session.startTime) {
          session.duration = Math.floor(
            (session.endTime.getTime() - session.startTime.getTime()) / 1000
          );
        }
      }

      this.logger.log(
        `👋 User left video session: ${userId} (Duration: ${session.duration}s)`
      );

      return session;
    } catch (error) {
      this.logger.error(`Failed to leave video session: ${error}`);
      throw error;
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    priority: Notification['priority'] = 'MEDIUM',
    channels: Notification['channels'] = ['PUSH', 'IN_APP'],
    data?: Record<string, any>
  ): Promise<Notification> {
    try {
      const notificationId = `notif-${Date.now()}`;
      const notification: Notification = {
        id: notificationId,
        userId,
        type,
        title,
        message,
        isRead: false,
        priority,
        channels,
        data,
        createdAt: new Date(),
      };

      this.notifications.set(notificationId, notification);

      this.logger.log(
        `🔔 Notification created: ${userId} (${type}) - ${title}`
      );

      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error}`);
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  async getNotifications(
    userId: string,
    limit = 50,
    unreadOnly = false
  ): Promise<Notification[]> {
    try {
      let notifications = Array.from(this.notifications.values())
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (unreadOnly) {
        notifications = notifications.filter((n) => !n.isRead);
      }

      return notifications.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification | null> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) return null;

      notification.isRead = true;
      notification.readAt = new Date();

      this.logger.log(`✅ Notification marked as read: ${notificationId}`);

      return notification;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error}`);
      throw error;
    }
  }

  /**
   * Set notification preferences
   */
  async setNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    try {
      let pref = this.notificationPreferences.get(userId);

      if (!pref) {
        pref = {
          id: `pref-${Date.now()}`,
          userId,
          notificationType: 'ALL',
          enabled: true,
          channels: {
            push: true,
            email: true,
            sms: false,
            inApp: true,
          },
        };
      }

      Object.assign(pref, preferences);
      this.notificationPreferences.set(userId, pref);

      this.logger.log(`⚙️ Notification preferences updated for ${userId}`);

      return pref;
    } catch (error) {
      this.logger.error(`Failed to set notification preferences: ${error}`);
      throw error;
    }
  }

  /**
   * Log collaboration activity
   */
  async logActivity(
    userId: string,
    type: CollaborationActivity['type'],
    resourceType: string,
    resourceId: string,
    description: string,
    details?: Record<string, any>
  ): Promise<CollaborationActivity> {
    try {
      const activity: CollaborationActivity = {
        id: `activity-${Date.now()}`,
        userId,
        type,
        resourceType,
        resourceId,
        description,
        details,
        timestamp: new Date(),
      };

      this.activities.push(activity);

      this.logger.log(`📝 Activity logged: ${type} - ${description}`);

      return activity;
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error}`);
      throw error;
    }
  }

  /**
   * Share document
   */
  async shareDocument(
    documentId: string,
    ownerId: string,
    type: DocumentShare['type'],
    shares: { userId: string; permission: 'VIEW' | 'COMMENT' | 'EDIT' }[]
  ): Promise<DocumentShare> {
    try {
      const shareId = `share-${Date.now()}`;
      const share: DocumentShare = {
        id: shareId,
        documentId,
        ownerId,
        type,
        sharedWith: shares,
        createdAt: new Date(),
      };

      this.documentShares.set(shareId, share);

      this.logger.log(
        `📄 Document shared: ${documentId} with ${shares.length} users`
      );

      return share;
    } catch (error) {
      this.logger.error(`Failed to share document: ${error}`);
      throw error;
    }
  }

  /**
   * Get collaboration dashboard
   */
  async getCollaborationDashboard(userId: string): Promise<any> {
    try {
      const userConversations = Array.from(this.conversations.values()).filter(
        (c) => c.participants.includes(userId)
      );

      const userNotifications = Array.from(this.notifications.values()).filter(
        (n) => n.userId === userId
      );

      const unreadNotifications = userNotifications.filter((n) => !n.isRead);

      const activeSessions = Array.from(this.videoSessions.values()).filter(
        (s) => s.status === 'ACTIVE'
      );

      const recentActivities = this.activities
        .filter((a) => {
          const isOwner = this.documentShares.values();
          return a.userId === userId;
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      return {
        conversations: {
          total: userConversations.length,
          unread: userConversations.filter(
            (c) => (c.unreadCount[userId] || 0) > 0
          ).length,
        },
        notifications: {
          total: userNotifications.length,
          unread: unreadNotifications.length,
          byType: this.groupBy(userNotifications, 'type'),
        },
        videoSessions: {
          active: activeSessions.length,
        },
        recentActivities: recentActivities,
      };
    } catch (error) {
      this.logger.error(`Failed to get collaboration dashboard: ${error}`);
      throw error;
    }
  }

  /**
   * Get conversation list
   */
  async getConversations(userId: string): Promise<ChatConversation[]> {
    try {
      return Array.from(this.conversations.values())
        .filter((c) => c.participants.includes(userId) && c.status !== 'CLOSED')
        .sort(
          (a, b) =>
            (b.updatedAt || b.createdAt).getTime() -
            (a.updatedAt || a.createdAt).getTime()
        );
    } catch (error) {
      this.logger.error(`Failed to get conversations: ${error}`);
      throw error;
    }
  }

  // Helper methods

  private groupBy(arr: any[], key: string): Record<string, number> {
    return arr.reduce((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
