import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
const bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: {
  name: string;
  email: string;
  username: string;
  password: string;
}) {
  console.log('DTO recibido:', dto);
  console.log('Password:', dto.password);
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (exists) {
      throw new BadRequestException('Email o username ya registrado');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        username: dto.username,
        password: hashed,
      },
    });

    return {
      statusCode: 201,
      intOpCode: 'SxUS201',
      data: [{ id: user.id, name: user.name, email: user.email, username: user.username }],
    };
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.username }, { username: dto.username }],
      },
      include: {
        groupMembers: {
          include: { group: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const permissionsByGroup: Record<string, string[]> = {};
    for (const member of user.groupMembers) {
      permissionsByGroup[member.groupId] = member.permissions;
    }

    const token = this.jwt.sign({
      sub: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      permissionsByGroup,
    });

    return {
      statusCode: 200,
      intOpCode: 'SxUS200',
      data: [{
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
        permissionsByGroup,
      }],
    };
  }
}