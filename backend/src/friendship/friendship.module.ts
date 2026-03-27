import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './provider/service';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Friendship } from './friendship.entity';

@Module({
   imports: [
    TypeOrmModule.forFeature([Friendship]),
  ],
  controllers: [FriendshipController],
  providers: [FriendshipService],
})
export class FriendshipModule {}
