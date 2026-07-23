import { Injectable } from '@nestjs/common';
import { ReportExportFormat, ReportJobStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../core/database/prisma.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { AuditService } from '../../../core/audit/audit.service';
import { findCatalogEntry } from './report-catalog';
import { exportReport, inferColumns } from './export/report-exporter';
import { ReportProviderResult } from './report.types';

const SYNC_ROW_THRESHOLD = 1000;
const FILE_RETENTION_HOURS = 24;

@Injectable()
export class ReportExportService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'reports');
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async generate(
    companyId: string,
    userId: string,
    params: {
      template: string;
      category: string;
      format: ReportExportFormat;
      period?: string;
      dateFrom?: string;
      dateTo?: string;
      branchId?: string;
      warehouseId?: string;
      currency?: string;
      q?: string;
      sort?: string;
    },
    reportResult: ReportProviderResult,
    ip?: string,
    requestId?: string,
  ) {
    const entry = findCatalogEntry(params.category, params.template);
    const title = entry?.name ?? `${params.category}/${params.template}`;
    const columns = inferColumns(reportResult.data);
    const allRows = reportResult.data;

    const job = await this.prisma.reportJob.create({
      data: {
        companyId,
        userId,
        template: params.template,
        category: params.category,
        format: params.format,
        period: params.period as never,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        parameters: {
          branchId: params.branchId,
          warehouseId: params.warehouseId,
          currency: params.currency,
          q: params.q,
          sort: params.sort,
        },
        rowCount: allRows.length,
        status: ReportJobStatus.PROCESSING,
        progress: 10,
      },
    });

    const isAsync = allRows.length >= SYNC_ROW_THRESHOLD;

    try {
      const exported = await exportReport({
        title,
        columns,
        rows: allRows,
        summary: reportResult.summary,
        totals: reportResult.totals,
        format: params.format,
      });

      const companyDir = path.join(this.uploadDir, companyId);
      fs.mkdirSync(companyDir, { recursive: true });

      const fileName = `${params.category}_${params.template}_${Date.now()}.${exported.extension}`;
      const filePath = path.join(companyDir, `${job.id}.${exported.extension}`);
      fs.writeFileSync(filePath, exported.buffer);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + FILE_RETENTION_HOURS);

      const updated = await this.prisma.reportJob.update({
        where: { id: job.id },
        data: {
          status: ReportJobStatus.COMPLETED,
          progress: 100,
          filePath,
          fileName,
          mimeType: exported.mimeType,
          fileSize: exported.buffer.length,
          completedAt: new Date(),
          expiresAt,
        },
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'GENERATE',
        entityType: 'report',
        entityId: job.id,
        newValue: {
          template: params.template,
          category: params.category,
          format: params.format,
          rowCount: allRows.length,
        },
        ipAddress: ip,
        requestId,
      });

      if (isAsync) {
        return {
          jobId: updated.id,
          status: updated.status,
          async: true,
          rowCount: allRows.length,
        };
      }

      return {
        jobId: updated.id,
        status: updated.status,
        async: false,
        rowCount: allRows.length,
        downloadUrl: `/api/v1/reports/jobs/${updated.id}/download`,
      };
    } catch (err) {
      await this.prisma.reportJob.update({
        where: { id: job.id },
        data: {
          status: ReportJobStatus.FAILED,
          errorMessage: err instanceof Error ? err.message : 'Export failed',
          progress: 0,
        },
      });
      throw AppException.unprocessable('REPORT_EXPORT_FAILED', 'Report export failed');
    }
  }

  async getJob(companyId: string, jobId: string) {
    const job = await this.prisma.reportJob.findFirst({
      where: { id: jobId, companyId },
    });
    if (!job) throw AppException.notFound('ReportJob', jobId);

    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      template: job.template,
      category: job.category,
      format: job.format,
      rowCount: job.rowCount ?? undefined,
      fileName: job.fileName ?? undefined,
      downloadUrl:
        job.status === ReportJobStatus.COMPLETED
          ? `/api/v1/reports/jobs/${job.id}/download`
          : undefined,
      errorMessage: job.errorMessage ?? undefined,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      expiresAt: job.expiresAt?.toISOString(),
    };
  }

  async getDownload(
    companyId: string,
    userId: string,
    jobId: string,
    ip?: string,
    requestId?: string,
  ) {
    const job = await this.prisma.reportJob.findFirst({
      where: { id: jobId, companyId, status: ReportJobStatus.COMPLETED },
    });
    if (!job) throw AppException.notFound('ReportJob', jobId);
    if (!job.filePath || !fs.existsSync(job.filePath)) {
      throw AppException.notFound('ReportFile', jobId);
    }
    if (job.expiresAt && job.expiresAt < new Date()) {
      throw AppException.businessRule('Report file has expired');
    }

    await this.audit.log({
      companyId,
      userId,
      action: 'DOWNLOAD',
      entityType: 'report',
      entityId: jobId,
      newValue: { template: job.template, category: job.category, format: job.format },
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
    });

    return {
      filePath: job.filePath,
      fileName: job.fileName ?? `report.${job.format.toLowerCase()}`,
      mimeType: job.mimeType ?? 'application/octet-stream',
    };
  }

  async listHistory(companyId: string, userId: string, page: number, limit: number) {
    const where = { companyId, userId };
    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.reportJob.count({ where }),
      this.prisma.reportJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: jobs.map((j) => ({
        id: j.id,
        reportName: findCatalogEntry(j.category, j.template)?.name ?? j.template,
        template: j.template,
        category: j.category,
        format: j.format,
        status: j.status,
        rowCount: j.rowCount,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt?.toISOString(),
        downloadUrl:
          j.status === ReportJobStatus.COMPLETED
            ? `/api/v1/reports/jobs/${j.id}/download`
            : undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }
}
