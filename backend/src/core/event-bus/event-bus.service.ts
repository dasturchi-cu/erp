import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class EventBusService {
  private readonly emitter = new EventEmitter();

  emit(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }

  on(event: string, listener: (payload: any) => void) {
    this.emitter.on(event, listener);
  }

  off(event: string, listener: (payload: any) => void) {
    this.emitter.off(event, listener);
  }
}
