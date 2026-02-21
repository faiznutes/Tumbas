import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [forwardRef(() => PaymentsModule), ShippingModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
