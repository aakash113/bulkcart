import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDraftDocument = HydratedDocument<OrderDraft>;

@Schema({ _id: false })
export class OrderDraftLine {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  subtotal: number;
}

const OrderDraftLineSchema = SchemaFactory.createForClass(OrderDraftLine);

@Schema()
export class OrderDraft {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  supplier: string;

  @Prop({ required: true, enum: ['draft', 'submitted'], default: 'draft' })
  status: string;

  @Prop({ required: true })
  updatedAt: string;

  @Prop({ type: [OrderDraftLineSchema], default: [] })
  lines: OrderDraftLine[];

  @Prop({ required: true })
  total: number;
}

export const OrderDraftSchema = SchemaFactory.createForClass(OrderDraft);
