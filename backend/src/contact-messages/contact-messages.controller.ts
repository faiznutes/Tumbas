import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ContactMessageStatus, UserRole } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContactMessagesService } from './contact-messages.service';

class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  message: string;
}

class UpdateContactMessageDto {
  @IsOptional()
  @IsEnum(ContactMessageStatus)
  status?: ContactMessageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}

class BulkUpdateContactMessageDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(ContactMessageStatus)
  status: ContactMessageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}

class BulkDeleteContactMessageDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller('contact-messages')
export class ContactMessagesController {
  constructor(private readonly contactMessagesService: ContactMessagesService) {}

  @Post()
  async create(@Body() dto: CreateContactMessageDto) {
    return this.contactMessagesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('messages.view')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ContactMessageStatus,
    @Query('search') search?: string,
  ) {
    return this.contactMessagesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('messages.edit')
  async updateById(
    @Param('id') id: string,
    @Body() dto: UpdateContactMessageDto,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.contactMessagesService.updateById(id, dto, req.user?.id);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('messages.edit')
  async bulkUpdate(@Body() dto: BulkUpdateContactMessageDto, @Req() req: { user?: { id?: string } }) {
    return this.contactMessagesService.bulkUpdate(dto.ids, dto.status, req.user?.id, dto.adminNotes);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('messages.edit')
  async deleteById(@Param('id') id: string) {
    return this.contactMessagesService.deleteById(id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('messages.edit')
  async bulkDelete(@Body() dto: BulkDeleteContactMessageDto) {
    return this.contactMessagesService.bulkDelete(dto.ids);
  }
}
