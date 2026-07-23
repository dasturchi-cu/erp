import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from '../application/notifications.service';
import { NotificationAlertsService } from '../application/notification-alerts.service';
import {
  CreateNotificationRequestDto,
  MarkAllReadResponseDto,
  NotificationListQueryDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from './dto/notifications.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(CompanyIsolationGuard)
@RequireModule('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly alertsService: NotificationAlertsService,
  ) {}

  @Get()
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'List notifications for current user' })
  list(@CurrentUser() user: JwtPayload, @Query() query: NotificationListQueryDto) {
    return this.notificationsService.list(user.companyId!, user.sub, {
      page: query.resolvedPage(),
      limit: query.resolvedLimit(),
      read: query.read,
      category: query.category,
    });
  }

  @Get('unread-count')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Unread notification count' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDto })
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.companyId!, user.sub);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, type: MarkAllReadResponseDto })
  markAllRead(
    @CurrentUser() user: JwtPayload,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.notificationsService.markAllRead(user.companyId!, user.sub, ip, requestId);
  }

  @Post('scan-alerts')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Scan business data and create alert notifications' })
  scanAlerts(@CurrentUser() user: JwtPayload) {
    return this.alertsService.scanAndCreateAlerts(user.companyId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Create notification (system/admin)' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNotificationRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.notificationsService.create(
      user.companyId!,
      user.sub,
      {
        title: dto.title,
        body: dto.body,
        severity: dto.severity,
        category: dto.category,
        userId: dto.user_id,
      },
      ip,
      requestId,
    );
  }

  @Get(':id')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.getById(user.companyId!, user.sub, id);
  }

  @Patch(':id')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Toggle read/unread status' })
  toggleRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.notificationsService.toggleRead(user.companyId!, user.sub, id, ip, requestId);
  }

  @Patch(':id/read')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.notificationsService.markRead(user.companyId!, user.sub, id, ip, requestId);
  }

  @Patch(':id/unread')
  @RequirePermissions('notifications.view')
  @ApiOperation({ summary: 'Mark notification as unread' })
  markUnread(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.notificationsService.markUnread(user.companyId!, user.sub, id, ip, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Delete notification (soft delete)' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    await this.notificationsService.delete(user.companyId!, user.sub, id, ip, requestId);
  }
}
