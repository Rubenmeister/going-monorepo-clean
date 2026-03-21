import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating, RatingDocument } from '../schemas/rating.schema';
import { IRatingRepository } from '../../domain/ports';

/**
 * MongoDB Rating Repository
 */
@Injectable()
export class MongoRatingRepository implements IRatingRepository {
  constructor(
    @InjectModel('Rating') private ratingModel: Model<RatingDocument>
  ) {}

  async create(rating: any): Promise<any> {
    const created = await this.ratingModel.create({
      ratingId: rating.id,
      tripId: rating.tripId,
      raterId: rating.raterId,
      rateeId: rating.rateeId,
      stars: rating.stars,
      review: rating.review,
      categories: rating.categories || {},
      photos: rating.photos || [],
      createdAt: rating.createdAt,
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<any> {
    const doc = await this.ratingModel.findOne({ ratingId: id });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByTrip(tripId: string): Promise<any> {
    const doc = await this.ratingModel.findOne({ tripId });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByRatee(rateeId: string, limit = 10): Promise<any[]> {
    const docs = await this.ratingModel
      .find({ rateeId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByRater(raterId: string, limit = 10): Promise<any[]> {
    const docs = await this.ratingModel
      .find({ raterId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async update(id: string, data: any): Promise<any> {
    const updated = await this.ratingModel.findOneAndUpdate(
      { ratingId: id },
      { $set: data },
      { new: true }
    );
    return updated ? this.mapToEntity(updated) : null;
  }

  async delete(id: string): Promise<void> {
    await this.ratingModel.deleteOne({ ratingId: id });
  }

  async findRecent(limit = 20): Promise<any[]> {
    const docs = await this.ratingModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByRateeWithStats(rateeId: string): Promise<{
    ratings: any[];
    stats: {
      averageRating: number;
      totalRatings: number;
      fiveStarCount: number;
      fourStarCount: number;
      threeStarCount: number;
      twoStarCount: number;
      oneStarCount: number;
    };
  }> {
    const ratings = await this.findByRatee(rateeId, 100);

    const stats = {
      averageRating: 0,
      totalRatings: ratings.length,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
    };

    if (ratings.length === 0) {
      return { ratings, stats };
    }

    let totalStars = 0;
    ratings.forEach((rating) => {
      totalStars += rating.stars;
      switch (rating.stars) {
        case 5:
          stats.fiveStarCount++;
          break;
        case 4:
          stats.fourStarCount++;
          break;
        case 3:
          stats.threeStarCount++;
          break;
        case 2:
          stats.twoStarCount++;
          break;
        case 1:
          stats.oneStarCount++;
          break;
      }
    });

    stats.averageRating = Math.round((totalStars / ratings.length) * 10) / 10;

    return { ratings, stats };
  }

  private mapToEntity(doc: any): any {
    return {
      id: doc.ratingId,
      tripId: doc.tripId,
      raterId: doc.raterId,
      rateeId: doc.rateeId,
      stars: doc.stars,
      review: doc.review,
      categories: doc.categories,
      photos: doc.photos,
      createdAt: doc.createdAt,
    };
  }
}
