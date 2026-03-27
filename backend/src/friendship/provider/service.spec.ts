import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FriendshipService } from '../provider/service';
import { Friendship } from '../friendship.entity';

describe('FriendshipService', () => {
  let service: FriendshipService;
  let repo: Repository<Friendship>;

  const userA = 'user-a';
  const userB = 'user-b';

  const mockRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendshipService,
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FriendshipService>(FriendshipService);
    repo = module.get<Repository<Friendship>>(
      getRepositoryToken(Friendship),
    );

    jest.clearAllMocks();
  });

  it('should send a friend request', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await service.sendRequest(userA, userB);

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith([
      { userId: userA, friendId: userB, status: 'pending' },
      { userId: userB, friendId: userA, status: 'pending' },
    ]);
  });

  it('should accept a friend request', async () => {
    await service.acceptRequest(userA, userB);

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith(
      [
        { userId: userA, friendId: userB },
        { userId: userB, friendId: userA },
      ],
      { status: 'accepted' },
    );
  });
});
