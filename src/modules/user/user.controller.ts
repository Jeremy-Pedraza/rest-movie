// src/modules/user/user.controller.ts

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { ROLES } from '@constants/roles.constant';
import { Roles } from '@decorators/roles.decorator';
import { UserService } from './user.service';
import { QueryUserDto } from './dto';
import { IUserResponse } from './interfaces';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(ROLES.ADMINISTRADOR)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<IApiResponse<IPaginatedResponse<IUserResponse>>> {
    const data = await this.userService.findAll(query);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar un usuario pendiente' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario aprobado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    const data = await this.userService.approve(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.AUTH.USER_APPROVED,
      data,
    };
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar/rechazar un usuario' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    const data = await this.userService.deactivate(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.AUTH.USER_REJECTED,
      data,
    };
  }
}
