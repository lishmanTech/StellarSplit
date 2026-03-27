import { Module } from '@nestjs/common';
import { MentionService } from './provider/service';

@Module({
  imports: [],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionsModule {}
