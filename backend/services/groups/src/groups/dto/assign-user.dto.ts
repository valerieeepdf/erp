import { IsString, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignUserDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  groupId: string;

  @IsArray()
  permissions: string[];
}