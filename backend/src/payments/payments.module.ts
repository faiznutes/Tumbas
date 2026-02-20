import { Module, forwardRef } from '@nestjs/common';
import { MidtransService } from './midtrans.service';
import { WebhookController } from './webhook.controller';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => OrdersModule), PrismaModule],
  providers: [MidtransService],
  controllers: [WebhookController],
  exports: [MidtransService],
})
export class PaymentsModule {}
