import { Injectable } from '@nestjs/common';

export interface Job {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class JobQueueService {
  private jobs = new Map<string, Job>();
  private activeJobsCount = 0;
  private readonly maxConcurrent = 3;
  private queue: Array<{ id: string; execute: () => Promise<any> }> = [];

  createJob(name: string): string {
    const id = Math.random().toString(36).substring(2, 15);
    this.jobs.set(id, {
      id,
      name,
      status: 'PENDING',
      progress: 0,
    });
    return id;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  enqueue(id: string, executeFn: () => Promise<any>) {
    this.queue.push({ id, execute: executeFn });
    void this.processNext();
  }

  private async processNext() {
    if (this.activeJobsCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const { id, execute } = this.queue.shift()!;
    const job = this.jobs.get(id);
    if (!job) return;

    this.activeJobsCount++;
    job.status = 'RUNNING';
    job.startedAt = new Date();

    try {
      const result = await execute();
      job.status = 'COMPLETED';
      job.result = result;
      job.progress = 100;
    } catch (err: any) {
      job.status = 'FAILED';
      job.error = err.message || String(err);
    } finally {
      job.completedAt = new Date();
      this.activeJobsCount--;
      void this.processNext();
    }
  }
}
