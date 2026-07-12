import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GamificationStatsSchema } from '../schemas/gamification.schema';
import { GamificationStats } from '../../social.service';

@Injectable()
export class GamificationRepository {
  private readonly logger = new Logger(GamificationRepository.name);

  constructor(
    @InjectModel(GamificationStatsSchema.name)
    private readonly model: Model<GamificationStatsSchema>,
  ) {}

  async findByUserId(userId: string): Promise<GamificationStats | null> {
    try {
      const doc = await this.model.findOne({ userId }).lean().exec();
      if (!doc) return null;
      return this.toStats(doc);
    } catch (e) {
      this.logger.error(`findByUserId error: ${e}`);
      return null;
    }
  }

  async upsert(userId: string, updates: Partial<GamificationStats>): Promise<GamificationStats> {
    try {
      const doc = await this.model.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true },
      ).lean().exec();
      return this.toStats(doc);
    } catch (e) {
      this.logger.error(`upsert error: ${e}`);
      throw e;
    }
  }

  async incrementPoints(userId: string, points: number): Promise<GamificationStats> {
    try {
      const doc = await this.model.findOneAndUpdate(
        { userId },
        { $inc: { totalPoints: points }, $setOnInsert: { userId } },
        { new: true, upsert: true },
      ).lean().exec();
      const stats = this.toStats(doc);
      // Recalculate level and tier
      stats.level = Math.floor(stats.totalPoints / 100) + 1;
      stats.currentLevelProgress = stats.totalPoints % 100;
      stats.tier = this.calcTier(stats.totalPoints) as any;
      await this.model.findOneAndUpdate({ userId }, { $set: { level: stats.level, currentLevelProgress: stats.currentLevelProgress, tier: stats.tier } }).exec();
      return stats;
    } catch (e) {
      this.logger.error(`incrementPoints error: ${e}`);
      throw e;
    }
  }

  async addBadge(userId: string, badgeCode: string): Promise<void> {
    try {
      await this.model.findOneAndUpdate(
        { userId },
        { $addToSet: { badges: badgeCode }, $setOnInsert: { userId } },
        { upsert: true },
      ).exec();
    } catch (e) {
      this.logger.error(`addBadge error: ${e}`);
    }
  }

  private calcTier(points: number): string {
    if (points >= 10000) return 'DIAMOND';
    if (points >= 5000) return 'PLATINUM';
    if (points >= 2000) return 'GOLD';
    if (points >= 500) return 'SILVER';
    return 'BRONZE';
  }

  private toStats(doc: any): GamificationStats {
    return {
      id: String(doc._id),
      userId: doc.userId,
      totalPoints: doc.totalPoints ?? 0,
      level: doc.level ?? 1,
      currentLevelProgress: doc.currentLevelProgress ?? 0,
      achievements: doc.achievements ?? [],
      streaks: doc.streaks ?? { deliveryStreak: 0, reviewStreak: 0, referralStreak: 0 },
      tier: doc.tier ?? 'BRONZE',
      nextTierPoints: doc.nextTierPoints,
      badges: doc.badges ?? [],
      leaderboardRank: doc.leaderboardRank,
      updatedAt: doc.updatedAt,
    };
  }
}
