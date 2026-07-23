import { Module } from '@nestjs/common';
import { NotificationsController } from './api/notifications.controller';
import { NotificationsService } from './application/notifications.service';
import { NotificationAlertsService } from './application/notification-alerts.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationAlertsService],
  exports: [NotificationsService, NotificationAlertsService],
})
export class NotificationsModule {}
