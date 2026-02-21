import {
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MidtransService } from './midtrans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type MidtransPayload = {
  order_id: string;
  status_code: string | number;
  gross_amount: string | number;
  transaction_status: string;
  transaction_id?: string;
  signature_key?: string;
};

@Controller('webhook')
export class WebhookController {
  constructor(
    private ordersService: OrdersService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private midtransService: MidtransService,
  ) {}

  @Post('midtrans')
  async handleMidtransWebhook(
    @Body() payload: MidtransPayload,
    @Headers('x-signature-key') signatureKeyHeader: string,
  ) {
    const signatureKey = signatureKeyHeader || payload.signature_key;
    const isValid = this.midtransService.verifyNotificationSignature({
      signatureKey,
      orderId: payload.order_id,
      statusCode: String(payload.status_code),
      grossAmount: payload.gross_amount,
    });

    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        provider: 'midtrans',
        payload: {
          ...payload,
          processing: {
            status: 'received',
            attempts: 0,
            receivedAt: new Date().toISOString(),
          },
        },
        signature: signatureKey,
        isValid,
      },
    });

    if (!isValid) {
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          payload: {
            ...payload,
            processing: {
              status: 'invalid_signature',
              attempts: 0,
              receivedAt: new Date().toISOString(),
            },
          },
        },
      });
      console.error('[ALERT] Midtrans webhook invalid signature', {
        orderId: payload.order_id,
      });
      throw new UnauthorizedException('Invalid signature');
    }

    const maxRetries = parseInt(this.configService.get('WEBHOOK_MAX_RETRIES') || '3', 10);
    const retryDelayMs = parseInt(this.configService.get('WEBHOOK_RETRY_DELAY_MS') || '300', 10);

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.ordersService.handleWebhook({
          order_id: payload.order_id,
          transaction_status: payload.transaction_status,
          transaction_id: payload.transaction_id,
          status_code: String(payload.status_code),
        });

        const status = result.success ? 'processed' : 'processed_with_warning';
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: {
            payload: {
              ...payload,
              processing: {
                status,
                attempts: attempt,
                receivedAt: new Date().toISOString(),
                result,
              },
            },
          },
        });

        if (!result.success) {
          console.error('[ALERT] Midtrans webhook processed with warning', {
            orderId: payload.order_id,
            message: result.message,
          });
        }

        return {
          ...result,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          await this.wait(retryDelayMs * attempt);
          continue;
        }
      }
    }

    await this.prisma.webhookLog.update({
      where: { id: webhookLog.id },
      data: {
        payload: {
          ...payload,
          processing: {
            status: 'failed',
            attempts: maxRetries,
            receivedAt: new Date().toISOString(),
            error: lastError instanceof Error ? lastError.message : 'unknown_error',
          },
        },
      },
    });
    console.error('[ALERT] Midtrans webhook failed after retries', {
      orderId: payload.order_id,
      retries: maxRetries,
    });

    throw new InternalServerErrorException('Webhook processing failed');
  }

  @Get('midtrans/monitor')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('reports.view')
  async getMidtransMonitor(@Query('minutes') minutes?: string) {
    const durationMinutes = Math.max(parseInt(minutes || '60', 10) || 60, 1);
    const since = new Date(Date.now() - durationMinutes * 60_000);

    const logs = await this.prisma.webhookLog.findMany({
      where: {
        provider: 'midtrans',
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    const invalidSignature = logs.filter((log) => !log.isValid).length;
    const failed = logs.filter((log) => this.getProcessingStatus(log.payload) === 'failed').length;
    const warning = logs.filter((log) => this.getProcessingStatus(log.payload) === 'processed_with_warning').length;
    const processed = logs.filter((log) => this.getProcessingStatus(log.payload) === 'processed').length;

    const recentFailures = logs
      .filter((log) => ['failed', 'invalid_signature', 'processed_with_warning'].includes(this.getProcessingStatus(log.payload)))
      .slice(0, 20)
      .map((log) => {
        const payload = log.payload as Record<string, unknown>;
        const processing = (payload.processing as Record<string, unknown> | undefined) || {};
        return {
          id: log.id,
          createdAt: log.createdAt,
          orderId: typeof payload.order_id === 'string' ? payload.order_id : null,
          status: this.getProcessingStatus(payload),
          attempts: typeof processing.attempts === 'number' ? processing.attempts : 0,
          error: typeof processing.error === 'string' ? processing.error : null,
        };
      });

    return {
      rangeMinutes: durationMinutes,
      since,
      summary: {
        totalReceived: logs.length,
        processed,
        warning,
        failed,
        invalidSignature,
      },
      recentFailures,
    };
  }

  private async wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getProcessingStatus(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return 'unknown';
    const record = payload as Record<string, unknown>;
    const processing = (record.processing as Record<string, unknown> | undefined) || {};
    return typeof processing.status === 'string' ? processing.status : 'unknown';
  }
}
