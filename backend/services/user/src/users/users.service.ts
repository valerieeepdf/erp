import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        groupMembers: {
          include: { group: true },
        },
      },
    });
    return { statusCode: 200, intOpCode: 'SxUS200', data: users };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        groupMembers: {
          include: { group: true },
        },
      },
    });
    return { statusCode: 200, intOpCode: 'SxUS200', data: [user] };
  }

  async updateUser(id: string, dto: { name?: string; email?: string; username?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });
    return { statusCode: 200, intOpCode: 'SxUS200', data: [user] };
  }
}