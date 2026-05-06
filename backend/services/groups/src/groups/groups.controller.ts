import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UsePipes, ValidationPipe } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AssignUserDto } from './dto/assign-user.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('setup')
  setupInitial(
    @Body() dto: { userId: string; groupName: string },
  ) {
    return this.groupsService.setupInitial(dto.userId, dto.groupName);
  }

  @Post('assign')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  assignUserToGroup(
    @Body() dto: AssignUserDto,
    @Headers('x-user-permissions') permissions: string,
  ) {
    const userPermissions = permissions ? JSON.parse(permissions) : [];
    return this.groupsService.assignUserToGroup(dto, userPermissions);
  }

  @Get()
  getAllGroups() {
    return this.groupsService.getAllGroups();
  }

  @Get('user/:userId')
  getGroupsByUser(@Param('userId') userId: string) {
    return this.groupsService.getGroupsByUser(userId);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createGroup(
    @Body() dto: CreateGroupDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-permissions') permissions: string,
  ) {
    const userPermissions = permissions ? JSON.parse(permissions) : [];
    return this.groupsService.createGroup(dto, userId, userPermissions);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateGroup(
    @Param('id') id: string,
    @Body() dto: CreateGroupDto,
    @Headers('x-user-permissions') permissions: string,
  ) {
    const userPermissions = permissions ? JSON.parse(permissions) : [];
    return this.groupsService.updateGroup(id, dto, userPermissions);
  }

  @Delete(':id')
  deleteGroup(
    @Param('id') id: string,
    @Headers('x-user-permissions') permissions: string,
  ) {
    const userPermissions = permissions ? JSON.parse(permissions) : [];
    return this.groupsService.deleteGroup(id, userPermissions);
  }

  @Get(':groupId/permissions/:userId')
  getGroupPermissions(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupsService.getGroupPermissions(userId, groupId);
  }
}