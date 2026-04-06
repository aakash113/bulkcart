import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  subtotal: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  vendorId: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  vendorName: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  eta: string;

  @Prop({ required: true })
  paymentStatus: string;

  @Prop()
  paymentReference?: string;

  @Prop()
  paymentMethod?: string;

  @Prop()
  cardLast4?: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
