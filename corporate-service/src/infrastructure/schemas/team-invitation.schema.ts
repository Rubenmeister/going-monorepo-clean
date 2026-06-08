import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Invitación a un nuevo miembro del equipo corporativo. Antes era in-memory
 * (se perdía en cada cold start, agravado por scale-to-zero). El `id` string
 * (inv_*) es el token del link de aceptación, por eso se conserva como campo.
 */
@Schema({ collection: 'corporate_team_invitations' })
export class TeamInvitationSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  invitedBy: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true })
  role: string;

  /** pending | accepted | expired */
  @Prop({ default: 'pending' })
  status: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  expiresAt: string;
}

export const TeamInvitationSchemaDefinition =
  SchemaFactory.createForClass(TeamInvitationSchema);
