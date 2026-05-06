import { Module } from '@nestjs/common';
import { GroupsModule } from './groups/groups.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, GroupsModule],
})
export class AppModule {}