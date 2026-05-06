import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async getAllGroups() {
    const groups = await this.prisma.group.findMany({
      include: { members: true },
    });
    return { statusCode: 200, intOpCode: 'SxGR200', data: groups };
  }

  async getGroupsByUser(userId: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
    });
    const groups = members.map(m => ({ ...m.group, permissions: m.permissions }));
    return { statusCode: 200, intOpCode: 'SxGR200', data: groups };
  }

  async createGroup(dto: { name: string; description?: string }, userId: string, userPermissions: string[]) {
    if (!userPermissions.includes('groups:manage')) {
      throw new ForbiddenException({ statusCode: 403, intOpCode: 'SxGR403', data: null });
    }
    const group = await this.prisma.group.create({
      data: { name: dto.name, description: dto.description },
    });
    return { statusCode: 201, intOpCode: 'SxGR201', data: [group] };
  }

  async updateGroup(id: string, dto: { name?: string; description?: string }, userPermissions: string[]) {
    if (!userPermissions.includes('groups:manage')) {
      throw new ForbiddenException({ statusCode: 403, intOpCode: 'SxGR403', data: null });
    }
    const group = await this.prisma.group.update({
      where: { id },
      data: dto,
    });
    return { statusCode: 200, intOpCode: 'SxGR200', data: [group] };
  }

  async deleteGroup(id: string, userPermissions: string[]) {
    if (!userPermissions.includes('groups:manage')) {
      throw new ForbiddenException({ statusCode: 403, intOpCode: 'SxGR403', data: null });
    }
    await this.prisma.group.delete({ where: { id } });
    return { statusCode: 200, intOpCode: 'SxGR200', data: null };
  }

  async assignUserToGroup(dto: { userId: string; groupId: string; permissions: string[] }, userPermissions: string[]) {
    if (!userPermissions.includes('groups:manage')) {
      throw new ForbiddenException({ statusCode: 403, intOpCode: 'SxGR403', data: null });
    }
    const member = await this.prisma.groupMember.upsert({
      where: { userId_groupId: { userId: dto.userId, groupId: dto.groupId } },
      update: { permissions: dto.permissions },
      create: { userId: dto.userId, groupId: dto.groupId, permissions: dto.permissions },
    });
    return { statusCode: 200, intOpCode: 'SxGR200', data: [member] };
  }

  async getGroupPermissions(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) throw new NotFoundException({ statusCode: 404, intOpCode: 'SxGR404', data: null });
    return { statusCode: 200, intOpCode: 'SxGR200', data: [{ permissions: member.permissions }] };
  }

  async setupInitial(userId: string, groupName: string) {
  const group = await this.prisma.group.create({
    data: {
      name: groupName,
      description: 'Grupo inicial',
    },
  });

  const member = await this.prisma.groupMember.create({
    data: {
      userId,
      groupId: group.id,
      permissions: [
        'tickets:add',
        'tickets:move',
        'groups:manage',
        'users:manage',
      ],
    },
  });

  return {
    statusCode: 201,
    intOpCode: 'SxGR201',
    data: [{ group, member }],
  };
}
}