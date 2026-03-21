/**
 * Social Features Service
 * Ratings, reviews, referral system, gamification and community engagement
 */

import { Injectable, Logger } from '@nestjs/common';

export interface UserReview {
  id?: string;
  userId: string;
  targetType: 'DELIVERY' | 'DRIVER' | 'RESTAURANT' | 'PRODUCT';
  targetId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  photos?: string[];
  helpful: number; // votes
  notHelpful: number; // votes
  verified: boolean; // verified purchase/delivery
  createdAt: Date;
  updatedAt?: Date;
}

export interface RatingAggregate {
  id?: string;
  targetId: string;
  targetType: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  lastUpdated: Date;
}

export interface ReferralProgram {
  id?: string;
  referrerId: string;
  referredUserId?: string;
  referralCode: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  referrerReward: number; // in credits
  referredReward: number; // in credits
  signupBonus: number;
  minimumDeliveryValue: number;
  expiryDate: Date;
  referredAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Badge {
  id?: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'DELIVERY' | 'COMMUNITY' | 'SOCIAL' | 'ACHIEVEMENT';
  requirement: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  reward: number; // bonus points
}

export interface UserAchievement {
  id?: string;
  userId: string;
  badgeId: string;
  badgeCode: string;
  unlockedAt: Date;
  progress?: number; // 0-100 for progress badges
}

export interface GamificationStats {
  userId: string;
  totalPoints: number;
  level: number;
  currentLevelProgress: number; // 0-100
  achievements: UserAchievement[];
  streaks: {
    deliveryStreak: number; // consecutive successful deliveries
    reviewStreak: number; // consecutive days with reviews
    referralStreak: number; // number of successful referrals
  };
  leaderboardRank?: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
}

export interface CommunityEvent {
  id?: string;
  name: string;
  description: string;
  type: 'CHALLENGE' | 'CONTEST' | 'TOURNAMENT' | 'SEASONAL';
  startDate: Date;
  endDate: Date;
  participantCount: number;
  prize: string;
  rules: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
}

export interface EventParticipant {
  id?: string;
  userId: string;
  eventId: string;
  score: number;
  rank?: number;
  rewards?: number;
  joinedAt: Date;
  completedAt?: Date;
}

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  // In-memory storage
  private reviews: Map<string, UserReview> = new Map();
  private ratings: Map<string, RatingAggregate> = new Map();
  private referrals: Map<string, ReferralProgram> = new Map();
  private badges: Map<string, Badge> = new Map();
  private achievements: Map<string, UserAchievement> = new Map();
  private gamificationStats: Map<string, GamificationStats> = new Map();
  private events: Map<string, CommunityEvent> = new Map();
  private eventParticipants: Map<string, EventParticipant> = new Map();

  constructor() {
    this.initializeBadges();
  }

  /**
   * Initialize default badges
   */
  private initializeBadges(): void {
    const defaultBadges: Badge[] = [
      {
        code: 'FIRST_DELIVERY',
        name: 'First Mile',
        description: 'Complete your first delivery',
        icon: '🚀',
        category: 'DELIVERY',
        requirement: '1_delivery',
        rarity: 'COMMON',
        reward: 10,
      },
      {
        code: 'SPEED_DEMON',
        name: 'Speed Demon',
        description: 'Complete 10 deliveries in 1 hour',
        icon: '⚡',
        category: 'DELIVERY',
        requirement: '10_deliveries_1hour',
        rarity: 'RARE',
        reward: 50,
      },
      {
        code: 'FIVE_STAR_DRIVER',
        name: 'Five Star Driver',
        description: 'Achieve 5-star rating with 50+ deliveries',
        icon: '⭐',
        category: 'COMMUNITY',
        requirement: '5star_50deliveries',
        rarity: 'EPIC',
        reward: 100,
      },
      {
        code: 'HELPFUL_REVIEWER',
        name: 'Helpful Reviewer',
        description: 'Get 100 helpful votes on your reviews',
        icon: '👍',
        category: 'SOCIAL',
        requirement: '100_helpful_votes',
        rarity: 'UNCOMMON',
        reward: 25,
      },
      {
        code: 'SOCIAL_BUTTERFLY',
        name: 'Social Butterfly',
        description: 'Invite 10 friends and they complete deliveries',
        icon: '🦋',
        category: 'SOCIAL',
        requirement: '10_referrals_completed',
        rarity: 'RARE',
        reward: 75,
      },
      {
        code: 'LEGENDARY_DRIVER',
        name: 'Legendary Driver',
        description: 'Complete 1000 deliveries',
        icon: '👑',
        category: 'ACHIEVEMENT',
        requirement: '1000_deliveries',
        rarity: 'LEGENDARY',
        reward: 500,
      },
    ];

    defaultBadges.forEach((badge) => {
      const badgeId = `badge-${badge.code}`;
      this.badges.set(badgeId, { ...badge, id: badgeId });
    });

    this.logger.log(`🏆 ${defaultBadges.length} default badges initialized`);
  }

  /**
   * Submit a review
   */
  async submitReview(
    userId: string,
    targetType: UserReview['targetType'],
    targetId: string,
    rating: number,
    title: string,
    content: string,
    photos?: string[],
    verified: boolean = false
  ): Promise<UserReview> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const reviewId = `review-${Date.now()}`;
      const review: UserReview = {
        id: reviewId,
        userId,
        targetType,
        targetId,
        rating,
        title,
        content,
        photos,
        helpful: 0,
        notHelpful: 0,
        verified,
        createdAt: new Date(),
      };

      this.reviews.set(reviewId, review);

      // Update rating aggregate
      await this.updateRatingAggregate(targetId, targetType);

      this.logger.log(`⭐ Review submitted: ${targetId} (${rating}/5 stars)`);

      return review;
    } catch (error) {
      this.logger.error(`Failed to submit review: ${error}`);
      throw error;
    }
  }

  /**
   * Update rating aggregate
   */
  private async updateRatingAggregate(
    targetId: string,
    targetType: string
  ): Promise<void> {
    try {
      const reviewsForTarget = Array.from(this.reviews.values()).filter(
        (r) => r.targetId === targetId && r.targetType === targetType
      );

      if (reviewsForTarget.length === 0) return;

      const aggregateId = `${targetType}-${targetId}`;
      const distribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };

      reviewsForTarget.forEach((review) => {
        const ratingKey = ['one', 'two', 'three', 'four', 'five'][
          review.rating - 1
        ] as keyof typeof distribution;
        distribution[ratingKey]++;
      });

      const averageRating =
        reviewsForTarget.reduce((sum, r) => sum + r.rating, 0) /
        reviewsForTarget.length;

      const aggregate: RatingAggregate = {
        id: aggregateId,
        targetId,
        targetType,
        averageRating,
        totalReviews: reviewsForTarget.length,
        ratingDistribution: distribution,
        lastUpdated: new Date(),
      };

      this.ratings.set(aggregateId, aggregate);
    } catch (error) {
      this.logger.error(`Failed to update rating aggregate: ${error}`);
    }
  }

  /**
   * Vote on review helpfulness
   */
  async voteReview(
    reviewId: string,
    helpful: boolean
  ): Promise<UserReview | null> {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) return null;

      if (helpful) {
        review.helpful++;
      } else {
        review.notHelpful++;
      }

      this.logger.log(
        `👍 Review vote recorded: ${reviewId} (${
          helpful ? 'Helpful' : 'Not helpful'
        })`
      );

      return review;
    } catch (error) {
      this.logger.error(`Failed to vote on review: ${error}`);
      throw error;
    }
  }

  /**
   * Get reviews for a target
   */
  async getReviews(
    targetId: string,
    targetType?: string,
    limit = 20,
    offset = 0
  ): Promise<UserReview[]> {
    try {
      let reviews = Array.from(this.reviews.values()).filter(
        (r) => r.targetId === targetId
      );

      if (targetType) {
        reviews = reviews.filter((r) => r.targetType === targetType);
      }

      return reviews
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);
    } catch (error) {
      this.logger.error(`Failed to get reviews: ${error}`);
      throw error;
    }
  }

  /**
   * Get rating for a target
   */
  async getRating(
    targetId: string,
    targetType: string
  ): Promise<RatingAggregate | null> {
    try {
      const aggregateId = `${targetType}-${targetId}`;
      return this.ratings.get(aggregateId) || null;
    } catch (error) {
      this.logger.error(`Failed to get rating: ${error}`);
      throw error;
    }
  }

  /**
   * Create referral program
   */
  async createReferral(
    referrerId: string,
    referrerReward: number = 500,
    referredReward: number = 250
  ): Promise<ReferralProgram> {
    try {
      const referralId = `ref-${Date.now()}`;
      const referralCode = `REFER${referrerId
        .substring(0, 8)
        .toUpperCase()}${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const referral: ReferralProgram = {
        id: referralId,
        referrerId,
        referralCode,
        status: 'ACTIVE',
        referrerReward,
        referredReward,
        signupBonus: referredReward,
        minimumDeliveryValue: 100,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      this.referrals.set(referralId, referral);
      this.logger.log(`🎁 Referral program created: ${referralCode}`);

      return referral;
    } catch (error) {
      this.logger.error(`Failed to create referral: ${error}`);
      throw error;
    }
  }

  /**
   * Complete referral (friend signed up and made first delivery)
   */
  async completeReferral(
    referralId: string,
    referredUserId: string
  ): Promise<ReferralProgram | null> {
    try {
      const referral = this.referrals.get(referralId);
      if (!referral) return null;

      referral.referredUserId = referredUserId;
      referral.status = 'COMPLETED';
      referral.completedAt = new Date();

      this.logger.log(
        `✅ Referral completed: ${referralId} (Rewards: ${referral.referrerReward} + ${referral.referredReward})`
      );

      return referral;
    } catch (error) {
      this.logger.error(`Failed to complete referral: ${error}`);
      throw error;
    }
  }

  /**
   * Get user's referral stats
   */
  async getReferralStats(userId: string): Promise<any> {
    try {
      const referrals = Array.from(this.referrals.values()).filter(
        (r) => r.referrerId === userId
      );

      const completed = referrals.filter((r) => r.status === 'COMPLETED');
      const pending = referrals.filter((r) => r.status === 'PENDING');
      const active = referrals.filter((r) => r.status === 'ACTIVE');

      const totalEarnings = completed.reduce(
        (sum, r) => sum + r.referrerReward,
        0
      );

      return {
        referralCode: referrals[0]?.referralCode,
        completedCount: completed.length,
        pendingCount: pending.length,
        totalReferred: completed.length,
        totalEarnings,
        activeReferrals: active.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get referral stats: ${error}`);
      throw error;
    }
  }

  /**
   * Unlock achievement/badge
   */
  async unlockAchievement(
    userId: string,
    badgeCode: string
  ): Promise<UserAchievement | null> {
    try {
      // Find badge by code
      let badgeId: string | null = null;
      let badge: Badge | null = null;

      for (const [id, b] of this.badges.entries()) {
        if (b.code === badgeCode) {
          badgeId = id;
          badge = b;
          break;
        }
      }

      if (!badgeId || !badge) {
        this.logger.warn(`Badge not found: ${badgeCode}`);
        return null;
      }

      // Check if user already has this badge
      const existing = Array.from(this.achievements.values()).find(
        (a) => a.userId === userId && a.badgeCode === badgeCode
      );

      if (existing) {
        return existing;
      }

      const achievementId = `ach-${Date.now()}`;
      const achievement: UserAchievement = {
        id: achievementId,
        userId,
        badgeId,
        badgeCode,
        unlockedAt: new Date(),
      };

      this.achievements.set(achievementId, achievement);

      // Update gamification stats
      await this.updateGamificationStats(userId);

      this.logger.log(`🏆 Achievement unlocked: ${userId} -> ${badgeCode}`);

      return achievement;
    } catch (error) {
      this.logger.error(`Failed to unlock achievement: ${error}`);
      throw error;
    }
  }

  /**
   * Get user's gamification stats
   */
  async getGamificationStats(userId: string): Promise<GamificationStats> {
    try {
      let stats = this.gamificationStats.get(userId);

      if (!stats) {
        stats = {
          userId,
          totalPoints: 0,
          level: 1,
          currentLevelProgress: 0,
          achievements: [],
          streaks: {
            deliveryStreak: 0,
            reviewStreak: 0,
            referralStreak: 0,
          },
          tier: 'BRONZE',
        };
        this.gamificationStats.set(userId, stats);
      }

      // Get user's achievements
      stats.achievements = Array.from(this.achievements.values()).filter(
        (a) => a.userId === userId
      );

      // Calculate tier based on points
      if (stats.totalPoints >= 10000) {
        stats.tier = 'DIAMOND';
      } else if (stats.totalPoints >= 5000) {
        stats.tier = 'PLATINUM';
      } else if (stats.totalPoints >= 2000) {
        stats.tier = 'GOLD';
      } else if (stats.totalPoints >= 1000) {
        stats.tier = 'SILVER';
      } else {
        stats.tier = 'BRONZE';
      }

      // Calculate level (every 1000 points = 1 level)
      stats.level = Math.floor(stats.totalPoints / 1000) + 1;
      stats.currentLevelProgress = (stats.totalPoints % 1000) / 10;

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get gamification stats: ${error}`);
      throw error;
    }
  }

  /**
   * Update gamification stats (add points)
   */
  async addPoints(userId: string, points: number): Promise<GamificationStats> {
    try {
      const stats = await this.getGamificationStats(userId);
      stats.totalPoints += points;

      this.logger.log(
        `⭐ Points added to ${userId}: +${points} (Total: ${stats.totalPoints})`
      );

      return stats;
    } catch (error) {
      this.logger.error(`Failed to add points: ${error}`);
      throw error;
    }
  }

  /**
   * Update gamification stats internally
   */
  private async updateGamificationStats(userId: string): Promise<void> {
    try {
      await this.getGamificationStats(userId);
    } catch (error) {
      this.logger.error(`Failed to update gamification stats: ${error}`);
    }
  }

  /**
   * Create community event
   */
  async createEvent(
    name: string,
    description: string,
    type: CommunityEvent['type'],
    startDate: Date,
    endDate: Date,
    prize: string,
    rules: string
  ): Promise<CommunityEvent> {
    try {
      const eventId = `event-${Date.now()}`;
      const event: CommunityEvent = {
        id: eventId,
        name,
        description,
        type,
        startDate,
        endDate,
        participantCount: 0,
        prize,
        rules,
        status: new Date() < startDate ? 'UPCOMING' : 'ACTIVE',
        createdAt: new Date(),
      };

      this.events.set(eventId, event);
      this.logger.log(`🎉 Community event created: ${name} (${type})`);

      return event;
    } catch (error) {
      this.logger.error(`Failed to create event: ${error}`);
      throw error;
    }
  }

  /**
   * Join event
   */
  async joinEvent(eventId: string, userId: string): Promise<EventParticipant> {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const participantId = `participant-${Date.now()}`;
      const participant: EventParticipant = {
        id: participantId,
        userId,
        eventId,
        score: 0,
        joinedAt: new Date(),
      };

      this.eventParticipants.set(participantId, participant);
      event.participantCount++;

      this.logger.log(`📝 User joined event: ${userId} -> ${eventId}`);

      return participant;
    } catch (error) {
      this.logger.error(`Failed to join event: ${error}`);
      throw error;
    }
  }

  /**
   * Get event leaderboard
   */
  async getEventLeaderboard(
    eventId: string,
    limit = 100
  ): Promise<EventParticipant[]> {
    try {
      const participants = Array.from(this.eventParticipants.values())
        .filter((p) => p.eventId === eventId)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      participants.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      return participants;
    } catch (error) {
      this.logger.error(`Failed to get leaderboard: ${error}`);
      throw error;
    }
  }

  /**
   * Get active events
   */
  async getActiveEvents(): Promise<CommunityEvent[]> {
    try {
      return Array.from(this.events.values()).filter(
        (e) => e.status === 'ACTIVE'
      );
    } catch (error) {
      this.logger.error(`Failed to get active events: ${error}`);
      throw error;
    }
  }
}
