import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  gateway: string;

  @Prop({ required: true })
  cardLast4: string;

  @Prop({ required: true })
  cardBrand: string;

  @Prop({ required: true })
  paymentMethodLabel: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
