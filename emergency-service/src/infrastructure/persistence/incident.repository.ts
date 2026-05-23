import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IncidentDocument,
  IncidentEntity,
  IncidentStatus,
} from '../schemas/incident.schema';

export interface CreateIncidentInput {
  userId:        string;
  channel:       IncidentEntity['channel'];
  emergencyType: IncidentEntity['emergencyType'];
  description?:  string;
  location:      { lat: number; lng: number };
  accuracyM?:    number;
  rideId?:       string;
  emergencyDialerTriggered?: boolean;
}

@Injectable()
export class IncidentRepository {
  constructor(
    @InjectModel('Incident') private readonly model: Model<IncidentDocument>,
  ) {}

  async create(input: CreateIncidentInput): Promise<IncidentDocument> {
    return this.model.create({
      userId:        input.userId,
      channel:       input.channel,
      emergencyType: input.emergencyType,
      priority:      'RED',
      description:   input.description,
      location: {
        type:        'Point',
        coordinates: [input.location.lng, input.location.lat],
      },
      accuracyM:     input.accuracyM,
      rideId:        input.rideId,
      emergencyDialerTriggered: input.emergencyDialerTriggered ?? false,
      status:        'open',
      notes:         [],
    });
  }

  async findById(id: string): Promise<IncidentDocument | null> {
    return this.model.findById(id).exec();
  }

  async listByStatus(status?: IncidentStatus, limit = 50, skip = 0): Promise<IncidentDocument[]> {
    const query = status ? { status } : {};
    return this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  }

  async updateStatus(
    id: string,
    status: IncidentStatus,
    operatorId?: string,
  ): Promise<IncidentDocument | null> {
    const update: any = { status, updatedAt: new Date() };
    if (operatorId) update.operatorId = operatorId;
    if (status === 'resolved' || status === 'false_alarm') update.resolvedAt = new Date();
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async addNote(id: string, operatorId: string, note: string): Promise<IncidentDocument | null> {
    return this.model.findByIdAndUpdate(
      id,
      {
        $push: { notes: { operatorId, note, timestamp: new Date() } },
        $set:  { updatedAt: new Date() },
      },
      { new: true },
    ).exec();
  }

  async countByStatus(status: IncidentStatus): Promise<number> {
    return this.model.countDocuments({ status }).exec();
  }
}
