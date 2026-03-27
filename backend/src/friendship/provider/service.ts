import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Friendship } from "../friendship.entity";
import { Repository } from "typeorm/repository/Repository";

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly repo: Repository<Friendship>,
  ) {}

  async sendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot friend yourself');
    }

    const exists = await this.repo.findOne({
      where: { userId, friendId },
    });

    if (exists) {
      throw new ConflictException('Request already exists');
    }

    await this.repo.save([
      { userId, friendId, status: 'pending' },
      { userId: friendId, friendId: userId, status: 'pending' },
    ]);
  }

  async acceptRequest(userId: string, friendId: string) {
    await this.repo.update(
      [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
      { status: 'accepted' },
    );
  }

  async block(userId: string, friendId: string) {
    await this.repo.update(
      { userId, friendId },
      { status: 'blocked' },
    );
  }

  async getFriends(userId: string) {
    return this.repo.find({
      where: { userId, status: 'accepted' },
    });
  }
}
