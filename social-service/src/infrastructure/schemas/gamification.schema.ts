import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'gamification_stats' })
export class GamificationStatsSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  currentLevelProgress: number;

  @Prop({ type: [Object], default: [] })
  achievements: Record<string, any>[];

  @Prop({
    type: Object,
    default: { deliveryStreak: 0, reviewStreak: 0, referralStreak: 0 },
  })
  streaks: {
    deliveryStreak: number;
    reviewStreak: number;
    referralStreak: number;
  };

  @Prop({ default: 'BRONZE' })
  tier: string;

  @Prop()
  nextTierPoints?: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop()
  leaderboardRank?: number;
}

export const GamificationStatsSchemaDefinition = SchemaFactory.createForClass(GamificationStatsSchema);
