import { Injectable, Logger } from '@nestjs/common';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { PilotErrorRecord } from './pilot-error.types';

@Injectable()
export class PilotErrorLogger {
  private readonly logger = new Logger('PilotError');
  private readonly logPath = join(process.cwd(), 'logs', 'pilot-errors.jsonl');
  private dirReady = false;

  async log(record: PilotErrorRecord): Promise<void> {
    const line = `${JSON.stringify(record)}\n`;
    this.logger.error(
      `[${record.timestamp}] ${record.user ?? 'anonymous'} ${record.action ?? '-'} — ${record.error}`,
    );
    try {
      if (!this.dirReady) {
        await mkdir(join(process.cwd(), 'logs'), { recursive: true });
        this.dirReady = true;
      }
      await appendFile(this.logPath, line, 'utf8');
    } catch (err) {
      this.logger.warn(`Failed to write pilot error log: ${String(err)}`);
    }
  }
}
