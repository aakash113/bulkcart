import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { OtpCode, OtpCodeSchema } from './schemas/otp.schema';
import { OrderDraft, OrderDraftSchema } from './schemas/order-draft.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { Shipment, ShipmentSchema } from './schemas/shipment.schema';
import { User, UserSchema } from './schemas/user.schema';

let memoryMongo: MongoMemoryServer | null = null;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const configuredUri = config.get<string>('MONGO_URI');
        const useInMemoryFlag = config.get<string>('USE_IN_MEMORY_DB');
        const useInMemory =
          useInMemoryFlag === 'true' || (!configuredUri && config.get<string>('NODE_ENV') !== 'production');

        const uri = useInMemory
          ? await (async () => {
              if (!memoryMongo) {
                memoryMongo = await MongoMemoryServer.create();
              }
              return memoryMongo.getUri();
            })()
          : configuredUri;

        return {
          uri,
          retryAttempts: 5,
          retryDelay: 2000,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderDraft.name, schema: OrderDraftSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Shipment.name, schema: ShipmentSchema },
      { name: OtpCode.name, schema: OtpCodeSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
