import { Controller, Post, Body, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Delete, Put, Get } from '@nestjs/common';
import { EspecieService } from './especie.service';
import { ApiResponseDto, EspecieResponseDto, ListEspeciesApiResponse } from './dtos/especie-response.dto';
import { ListEspeciesRequestDto } from './dtos/especie-list.dto';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { DeleteEspecieDto, InactivarEspecieDto } from './dtos/especie-delete.dto';
import { UpdateEspecieDto } from './dtos/especie-update.dto';
import { CreateEspecieDto } from './dtos/especie-create.dto';

@Controller('especie')
export class EspeciesController {
    constructor(private readonly especiesService: EspecieService) { }

    @Post('listar')
    @Auth(ValidRoles.admin)
    async listarEspecies(
        @Body() requestDto: ListEspeciesRequestDto,
    ): Promise<ListEspeciesApiResponse> {
        try {
            const resultado = await this.especiesService.listarEspecies(requestDto);

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

    @Post('crear')
    @Auth(ValidRoles.admin)
    async crearEspecie(
        @Body() createDto: CreateEspecieDto,
    ): Promise<ApiResponseDto<EspecieResponseDto>> {
        try {
            const resultado = await this.especiesService.crearEspecie(createDto);

            return {
                ok: true,
                mensaje: 'Especie creada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al crear especie',
                    resultado: {},
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('actualizar/:id')
    @Auth(ValidRoles.admin)
    async actualizarEspecie(
        @Param('id', ParseIntPipe) especieId: number,
        @Body() updateDto: UpdateEspecieDto,
    ): Promise<ApiResponseDto<EspecieResponseDto>> {
        try {
            const resultado = await this.especiesService.actualizarEspecie(especieId, updateDto);

            return {
                ok: true,
                mensaje: 'Especie actualizada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al actualizar especie',
                    resultado: {},
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Delete('eliminar')
    @Auth(ValidRoles.admin)
    async eliminarEspecie(
        @Body() deleteDto: DeleteEspecieDto,
    ): Promise<ApiResponseDto<{ mensaje: string }>> {
        try {
            const resultado = await this.especiesService.eliminarEspecie(deleteDto);

            return {
                ok: true,
                mensaje: resultado.mensaje,
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al eliminar especie',
                    resultado: {},
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Patch('inactivar')
    @Auth(ValidRoles.admin)
    async inactivarEspecie(
        @Body() inactivarDto: InactivarEspecieDto,
    ): Promise<ApiResponseDto<EspecieResponseDto>> {
        try {
            const resultado = await this.especiesService.inactivarEspecie(inactivarDto);

            return {
                ok: true,
                mensaje: 'Especie inactivada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al inactivar especie',
                    resultado: {},
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Patch('reactivar/:id')
    @Auth(ValidRoles.admin)
    async reactivarEspecie(
        @Param('id', ParseIntPipe) especieId: number,
        @Body('usuarioMod') usuarioMod?: string,
    ): Promise<ApiResponseDto<EspecieResponseDto>> {
        try {
            const resultado = await this.especiesService.reactivarEspecie(especieId, usuarioMod);

            return {
                ok: true,
                mensaje: 'Especie reactivada exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al reactivar especie',
                    resultado: {},
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get('obtener/:id')
    @Auth(ValidRoles.admin)
    async obtenerEspecie(
        @Param('id', ParseIntPipe) especieId: number,
    ): Promise<ApiResponseDto<EspecieResponseDto>> {
        try {
            const resultado = await this.especiesService.obtenerEspecie(especieId);

            return {
                ok: true,
                mensaje: 'Especie obtenida exitosamente',
                resultado,
            };
        } catch (error) {
            throw new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error al obtener especie',
                    resultado: {},
                },
                error.status || HttpStatus.BAD_REQUEST,
            );
        }
    }
}