import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'blockchain_blocks' })
export class BlockSchema extends Document {
  @Prop({ required: true, unique: true })
  blockIndex: number;

  @Prop({ required: true, unique: true })
  hash: string;

  @Prop({ required: true })
  previousHash: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: [Object], default: [] })
  transactions: Record<string, any>[];

  @Prop({ required: true })
  merkleRoot: string;

  @Prop({ default: 0 })
  nonce: number;
}

export const BlockSchemaDefinition = SchemaFactory.createForClass(BlockSchema);
BlockSchemaDefinition.index({ hash: 1 }, { unique: true });
