import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpCodeDocument = HydratedDocument<OtpCode>;

@Schema({ timestamps: true })
export class OtpCode {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  purpose: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  verificationToken?: string;
}

export const OtpCodeSchema = SchemaFactory.createForClass(OtpCode);
