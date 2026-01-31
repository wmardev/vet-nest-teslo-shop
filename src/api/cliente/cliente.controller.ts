import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Put,
  Get,
} from '@nestjs/common';
import { ClienteService } from './cliente.service';
import {
  ApiResponseDto,
  ClienteResponseDto,
  ListClientesApiResponse,
} from './dtos/cliente-response.dto';
import { ListClientesRequestDto } from './dtos/cliente-list.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import {
  DeleteClienteDto,
  InactivarClienteDto,
} from './dtos/cliente-delete.dto';
import { UpdateClienteDto } from './dtos/cliente-update.dto';
import { CreateClienteDto } from './dtos/cliente-create.dto';
import { User } from 'src/auth/entities/user.entity';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClienteService) {}

  @Post('listar')
  @Auth(ValidRoles.admin)
  async listarClientes(
    @Body() requestDto: ListClientesRequestDto,
  ): Promise<ListClientesApiResponse> {
    try {
      const resultado = await this.clientesService.listarClientes(requestDto);

      const mensaje =
        resultado.data.length > 0
          ? 'Listado exitoso'
          : 'No se encontraron resultados';

      return {
        ok: true,
        mensaje,
        resultado,
      };
    } catch (error) {
      // Siempre retornar el mismo formato en caso de error
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error interno del servidor',
          resultado: {},
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Crear nuevo cliente
  @Post('crear')
  @Auth(ValidRoles.admin)
  async crearCliente(
    @Body() createDto: CreateClienteDto,
    @GetUser() user: User,
  ): Promise<ApiResponseDto<ClienteResponseDto>> {
    try {
      const resultado = await this.clientesService.crearCliente(
        createDto,
        user,
      );

      return {
        ok: true,
        mensaje: 'Cliente creado exitosamente',
        resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error al crear cliente',
          resultado: {},
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Actualizar cliente
  @Put('actualizar/:id')
  @Auth(ValidRoles.admin)
  async actualizarCliente(
    @Param('id', ParseIntPipe) clienteId: number,
    @Body() updateDto: UpdateClienteDto,
    @GetUser() user: User,
  ): Promise<ApiResponseDto<ClienteResponseDto>> {
    try {
      const resultado = await this.clientesService.actualizarCliente(
        clienteId,
        updateDto,
        user,
      );

      return {
        ok: true,
        mensaje: 'Cliente actualizado exitosamente',
        resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error al actualizar cliente',
          resultado: {},
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Eliminar cliente (físico)
  @Delete('eliminar')
  @Auth(ValidRoles.admin)
  async eliminarCliente(
    @Body() deleteDto: DeleteClienteDto,
  ): Promise<ApiResponseDto<{ mensaje: string }>> {
    try {
      const resultado = await this.clientesService.eliminarCliente(deleteDto);

      return {
        ok: true,
        mensaje: resultado.mensaje,
        resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error al eliminar cliente',
          resultado: {},
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Inactivar cliente (eliminación lógica)
  @Patch('inactivar')
  @Auth(ValidRoles.admin)
  async inactivarCliente(
    @Body() inactivarDto: InactivarClienteDto,
    @GetUser() user: User,
  ): Promise<ApiResponseDto<ClienteResponseDto>> {
    try {
      const resultado = await this.clientesService.inactivarCliente(
        inactivarDto,
        user,
      );

      return {
        ok: true,
        mensaje: 'Cliente inactivado exitosamente',
        resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error al inactivar cliente',
          resultado: {},
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Reactivar cliente
  @Patch('reactivar/:id')
  @Auth(ValidRoles.admin)
  async reactivarCliente(
    @Param('id', ParseIntPipe) clienteId: number,
    @GetUser() user: User,
  ): Promise<ApiResponseDto<ClienteResponseDto>> {
    try {
      const resultado = await this.clientesService.reactivarCliente(
        clienteId,
        user,
      );

      return {
        ok: true,
        mensaje: 'Cliente reactivado exitosamente',
        resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error al reactivar cliente',
          resultado: {},
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Obtener cliente por ID
  @Get('obtener/:id')
  @Auth(ValidRoles.admin)
  async obtenerCliente(
    @Param('id', ParseIntPipe) clienteId: number,
  ): Promise<ApiResponseDto<ClienteResponseDto>> {
    try {
      const resultado = await this.clientesService.obtenerCliente(clienteId);

      return {
        ok: true,
        mensaje: 'Cliente obtenido exitosamente',
        resultado,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          mensaje: error.message || 'Error al obtener cliente',
          resultado: {},
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
