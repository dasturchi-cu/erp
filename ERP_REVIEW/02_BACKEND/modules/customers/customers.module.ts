import { Module } from '@nestjs/common';
import { CustomersController } from './api/customers.controller';
import { CustomersService } from './application/customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
