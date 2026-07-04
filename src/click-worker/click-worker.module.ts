import { Module } from '@nestjs/common';
import { ClickWorkerService } from './click-worker.service';

@Module({
  providers: [ClickWorkerService],
})
export class ClickWorkerModule {}
