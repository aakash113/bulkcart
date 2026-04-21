import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ShipmentDocument = HydratedDocument<Shipment>;

@Schema()
export class Shipment {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  warehouse: string;

  @Prop({ required: true })
  carrier: string;

  @Prop({ required: true })
  trackingNumber: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  lineCount: number;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);
