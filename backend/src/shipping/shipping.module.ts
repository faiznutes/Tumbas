import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [ShippingService],
  controllers: [ShippingController],
  exports: [ShippingService],
})
export class ShippingModule {}
