import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamInvitationSchema } from '../schemas/team-invitation.schema';

@Injectable()
export class TeamInvitationRepository {
  constructor(
    @InjectModel(TeamInvitationSchema.name)
    private readonly model: Model<TeamInvitationSchema>,
  ) {}

  async create(data: Partial<TeamInvitationSchema>): Promise<TeamInvitationSchema> {
    const doc = new this.model(data);
    return doc.save() as any;
  }

  async findByCompany(companyId: string): Promise<TeamInvitationSchema[]> {
    return this.model.find({ companyId }).sort({ createdAt: -1 }).lean().exec() as any;
  }
}
