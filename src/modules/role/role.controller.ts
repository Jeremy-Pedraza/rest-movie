// src/modules/role/role.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { IApiResponse } from '@shared/common';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { ROLES } from '@constants/roles.constant';
import { Roles } from '@decorators/roles.decorator';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { IRoleResponse } from './interfaces';

@ApiTags('Roles')
@ApiBearerAuth()
@Roles(ROLES.ADMINISTRADOR)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  @ApiResponse({ status: 409, description: 'El rol ya existe' })
  async create(@Body() dto: CreateRoleDto): Promise<IApiResponse<IRoleResponse>> {
    const data = await this.roleService.create(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async findAll(): Promise<IApiResponse<IRoleResponse[]>> {
    const data = await this.roleService.findAll();
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  @ApiResponse({ status: 200, description: 'Rol encontrado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IRoleResponse>> {
    const data = await this.roleService.findById(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<IApiResponse<IRoleResponse>> {
    const data = await this.roleService.update(id, dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.UPDATED,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  @ApiResponse({ status: 200, description: 'Rol eliminado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<void>> {
    await this.roleService.delete(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.DELETED,
    };
  }
}
