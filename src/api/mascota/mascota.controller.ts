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
    Get
} from '@nestjs/common';
import { MascotaService } from './mascota.service';
import {
    ApiResponseDto,
    MascotaResponseDto,
    ListMascotasApiResponse,
    MascotaSimpleResponseDto
} from './dtos/mascota-response.dto';
import { ListMascotasRequestDto } from './dtos/mascota-list.dto';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { DeleteMascotaDto, InactivarMascotaDto } from './dtos/mascota-delete.dto';
import { UpdateMascotaDto } from './dtos/mascota-update.dto';
import { CreateMascotaDto } from './dtos/mascota-create.dto';

@Controller('mascota')
export class MascotasController {
    constructor(private readonly mascotasService: MascotaService) { }

    @Post('listar')
    @Auth(ValidRoles.admin)
    async listarMascotas(
        @Body() requestDto: ListMascotasRequestDto,
    ): Promise<ListMascotasApiResponse> {
        try {
            const resultado = await this.mascotasService.listarMascotas(requestDto);

            const mensaje = resultado.data.length > 0
                ? 'Listado exitoso'
                : 'No se encontraron resultados';

            return {
                ok: true,
                mensaje,
                resultado,
            };
        } catch (error) {
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

    @Get('por-cliente/:clienteId')
    @Auth(ValidRoles.admin)
    async obtenerMascotasPorCliente(
        @Param('clienteId', ParseIntPipe) clienteId: number,
    ): Promise<ApiResponseDto<MascotaSimpleResponseDto[]>> {
        try {
            const resultado = await this.mascotasService.obtenerMascotasPorCliente(clienteId);

            return {
                ok: true,
                mensaje: resultado.length > 0 ? 'Mascotas obtenidas exitosamente' : 'No se encontraron mascotas para este cliente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al obtener mascotas por cliente',
                    resultado: [],
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post('crear')
    @Auth(ValidRoles.admin)
    async crearMascota(
        @Body() createDto: CreateMascotaDto,
    ): Promise<ApiResponseDto<MascotaResponseDto>> {
        try {
            const resultado = await this.mascotasService.crearMascota(createDto);

            return {
                ok: true,
                mensaje: 'Mascota creada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al crear mascota',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('actualizar/:id')
    @Auth(ValidRoles.admin)
    async actualizarMascota(
        @Param('id', ParseIntPipe) mascotaId: number,
        @Body() updateDto: UpdateMascotaDto,
    ): Promise<ApiResponseDto<MascotaResponseDto>> {
        try {
            const resultado = await this.mascotasService.actualizarMascota(mascotaId, updateDto);

            return {
                ok: true,
                mensaje: 'Mascota actualizada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al actualizar mascota',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Delete('eliminar')
    @Auth(ValidRoles.admin)
    async eliminarMascota(
        @Body() deleteDto: DeleteMascotaDto,
    ): Promise<ApiResponseDto<{ mensaje: string }>> {
        try {
            const resultado = await this.mascotasService.eliminarMascota(deleteDto);

            return {
                ok: true,
                mensaje: resultado.mensaje,
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al eliminar mascota',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Patch('inactivar')
    @Auth(ValidRoles.admin)
    async inactivarMascota(
        @Body() inactivarDto: InactivarMascotaDto,
    ): Promise<ApiResponseDto<MascotaResponseDto>> {
        try {
            const resultado = await this.mascotasService.inactivarMascota(inactivarDto);

            return {
                ok: true,
                mensaje: 'Mascota inactivada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al inactivar mascota',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Patch('reactivar/:id')
    @Auth(ValidRoles.admin)
    async reactivarMascota(
        @Param('id', ParseIntPipe) mascotaId: number,
        @Body('usuarioMod') usuarioMod?: string,
    ): Promise<ApiResponseDto<MascotaResponseDto>> {
        try {
            const resultado = await this.mascotasService.reactivarMascota(mascotaId, usuarioMod);

            return {
                ok: true,
                mensaje: 'Mascota reactivada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al reactivar mascota',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get('obtener/:id')
    @Auth(ValidRoles.admin)
    async obtenerMascota(
        @Param('id', ParseIntPipe) mascotaId: number,
    ): Promise<ApiResponseDto<MascotaResponseDto>> {
        try {
            const resultado = await this.mascotasService.obtenerMascota(mascotaId);

            return {
                ok: true,
                mensaje: 'Mascota obtenida exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al obtener mascota',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }
}