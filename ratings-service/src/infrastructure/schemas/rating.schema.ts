import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RatingDocument = Document & Rating;

@Schema({ timestamps: true, collection: 'ratings' })
export class Rating {
  @Prop({ required: true, unique: true })
  ratingId: string;

  @Prop({ required: true, index: true })
  tripId: string;

  @Prop({ required: true, index: true })
  raterId: string;

  @Prop({ required: true, index: true })
  rateeId: string;

  @Prop({ required: true, min: 1, max: 5 })
  stars: number;

  @Prop()
  review?: string;

  @Prop({
    type: {
      cleanliness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      driving: { type: Number, min: 1, max: 5 },
      behavior: { type: Number, min: 1, max: 5 },
    },
    default: {},
  })
  categories: {
    cleanliness?: number;
    communication?: number;
    driving?: number;
    behavior?: number;
  };

  @Prop({
    type: [
      {
        url: String,
        caption: String,
      },
    ],
    default: [],
  })
  photos: Array<{
    url: string;
    caption?: string;
  }>;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 7776000000) }) // 90 days
  expiresAt: Date;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// Create indexes
RatingSchema.index({ tripId: 1, createdAt: -1 });
RatingSchema.index({ raterId: 1, createdAt: -1 });
RatingSchema.index({ rateeId: 1, createdAt: -1 });
RatingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
