import { Module } from '@nestjs/common';
import { CategoriesController } from './api/categories.controller';
import { CategoriesService } from './application/categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
