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
    Query
} from '@nestjs/common';
import { RazaService } from './raza.service';
import {
    ApiResponseDto,
    RazaDetalleResponseDto,
    ListRazasApiResponse,
    RazaResponseDto
} from './dtos/raza-response.dto';
import { ListRazasRequestDto } from './dtos/raza-list.dto';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { DeleteRazaDto, InactivarRazaDto } from './dtos/raza-delete.dto';
import { UpdateRazaDto } from './dtos/raza-update.dto';
import { CreateRazaDto } from './dtos/raza-create.dto';

@Controller('raza')
export class RazasController {
    constructor(private readonly razasService: RazaService) { }

    @Post('listar')
    @Auth(ValidRoles.admin)
    async listarRazas(
        @Body() requestDto: ListRazasRequestDto,
    ): Promise<ListRazasApiResponse> {
        try {
            const resultado = await this.razasService.listarRazas(requestDto);

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

    @Get('por-especie/:especieId')
    @Auth(ValidRoles.admin)
    async obtenerRazasPorEspecie(
        @Param('especieId', ParseIntPipe) especieId: number,
    ): Promise<ApiResponseDto<RazaResponseDto[]>> {
        try {
            const resultado = await this.razasService.obtenerRazasPorEspecie(especieId);

            return {
                ok: true,
                mensaje: resultado.length > 0 ? 'Razas obtenidas exitosamente' : 'No se encontraron razas para esta especie',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al obtener razas por especie',
                    resultado: [],
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post('crear')
    @Auth(ValidRoles.admin)
    async crearRaza(
        @Body() createDto: CreateRazaDto,
    ): Promise<ApiResponseDto<RazaDetalleResponseDto>> {
        try {
            const resultado = await this.razasService.crearRaza(createDto);

            return {
                ok: true,
                mensaje: 'Raza creada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al crear raza',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('actualizar/:id')
    @Auth(ValidRoles.admin)
    async actualizarRaza(
        @Param('id', ParseIntPipe) razaId: number,
        @Body() updateDto: UpdateRazaDto,
    ): Promise<ApiResponseDto<RazaDetalleResponseDto>> {
        try {
            const resultado = await this.razasService.actualizarRaza(razaId, updateDto);

            return {
                ok: true,
                mensaje: 'Raza actualizada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al actualizar raza',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Delete('eliminar')
    @Auth(ValidRoles.admin)
    async eliminarRaza(
        @Body() deleteDto: DeleteRazaDto,
    ): Promise<ApiResponseDto<{ mensaje: string }>> {
        try {
            const resultado = await this.razasService.eliminarRaza(deleteDto);

            return {
                ok: true,
                mensaje: resultado.mensaje,
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al eliminar raza',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Patch('inactivar')
    @Auth(ValidRoles.admin)
    async inactivarRaza(
        @Body() inactivarDto: InactivarRazaDto,
    ): Promise<ApiResponseDto<RazaDetalleResponseDto>> {
        try {
            const resultado = await this.razasService.inactivarRaza(inactivarDto);

            return {
                ok: true,
                mensaje: 'Raza inactivada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al inactivar raza',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Patch('reactivar/:id')
    @Auth(ValidRoles.admin)
    async reactivarRaza(
        @Param('id', ParseIntPipe) razaId: number,
        @Body('usuarioMod') usuarioMod?: string,
    ): Promise<ApiResponseDto<RazaDetalleResponseDto>> {
        try {
            const resultado = await this.razasService.reactivarRaza(razaId, usuarioMod);

            return {
                ok: true,
                mensaje: 'Raza reactivada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al reactivar raza',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get('obtener/:id')
    @Auth(ValidRoles.admin)
    async obtenerRaza(
        @Param('id', ParseIntPipe) razaId: number,
    ): Promise<ApiResponseDto<RazaDetalleResponseDto>> {
        try {
            const resultado = await this.razasService.obtenerRaza(razaId);

            return {
                ok: true,
                mensaje: 'Raza obtenida exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al obtener raza',
                    resultado: null,
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }
}