import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class TierPrice {
  @Prop({ required: true })
  minQty: number;

  @Prop({ required: true })
  price: number;
}

const TierPriceSchema = SchemaFactory.createForClass(TierPrice);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  supplierId: string;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ required: true })
  origin: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  minOrderQuantity: number;

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  reviews: number;

  @Prop({ required: true })
  leadTimeDays: number;

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ required: true })
  inventory: number;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [TierPriceSchema], default: [] })
  tierPricing: TierPrice[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
