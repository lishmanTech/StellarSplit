import { Module } from '@nestjs/common';
import { SplitCommentsController } from './split-comments.controller';
import { SplitCommentService } from './provider/provider.service';
import { SplitComment } from './split-comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { MentionsModule } from '@/mentions/mentions.module';
import { EventEmitterModule } from '@nestjs/event-emitter/dist/event-emitter.module';

@Module({
   imports: [
    TypeOrmModule.forFeature([SplitComment]), 
    MentionsModule,
    EventEmitterModule.forRoot(), 
  ],
  controllers: [SplitCommentsController],
  providers: [SplitCommentService]
})
export class SplitCommentsModule {}
