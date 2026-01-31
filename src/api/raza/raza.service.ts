import {
    Injectable,
    HttpException,
    HttpStatus,
    ConflictException,
    BadRequestException,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import {
    ListRazasResponseDto,
    RazaResponseDto,
    RazaDetalleResponseDto
} from './dtos/raza-response.dto';
import { ListRazasRequestDto } from './dtos/raza-list.dto';
import { Raza } from './entity/raza.entity';

import { CreateRazaDto } from './dtos/raza-create.dto';
import { UpdateRazaDto } from './dtos/raza-update.dto';
import { DeleteRazaDto, InactivarRazaDto } from './dtos/raza-delete.dto';
import { Especie } from '../especie/entity/especie.entity';

@Injectable()
export class RazaService {
    constructor(
        @InjectRepository(Raza)
        private razaRepository: Repository<Raza>,
        @InjectRepository(Especie)
        private especieRepository: Repository<Especie>,
    ) { }

    async listarRazas(request: ListRazasRequestDto): Promise<ListRazasResponseDto> {
        try {
            const { paginacion = {}, filtros = {}, ordenamiento = {} } = request;

            // Configurar paginación
            const pagina = paginacion.pagina || 1;
            const limite = paginacion.limite || 25;
            const offset = paginacion.offset || (pagina - 1) * limite;

            // Crear query builder con join a especie
            const queryBuilder = this.razaRepository.createQueryBuilder('raza')
                .leftJoinAndSelect('raza.especie', 'especie');

            // Aplicar filtros
            this.aplicarFiltros(queryBuilder, filtros);

            // Contar total de registros
            const total = await queryBuilder.getCount();

            // Aplicar ordenamiento
            const campoOrden = ordenamiento.campo || 'nombre';
            const direccionOrden = ordenamiento.direccion?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            this.aplicarOrdenamiento(queryBuilder, campoOrden, direccionOrden);

            // Aplicar paginación
            queryBuilder.skip(offset).take(limite);

            // Ejecutar consulta
            const razas = await queryBuilder.getMany();

            // Mapear respuesta
            const data = razas.map(raza => this.mapearRazaResponse(raza));

            // Calcular paginación
            const totalPaginas = Math.ceil(total / limite);

            return {
                data,
                paginacion: {
                    pagina,
                    limite,
                    total,
                    totalPaginas,
                },
            };
        } catch (error) {
            throw new HttpException(
                `Error al listar razas: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private aplicarFiltros(queryBuilder: any, filtros: any): void {
        // Filtro de búsqueda general
        if (filtros.search) {
            const searchTerm = `%${filtros.search}%`;
            queryBuilder.andWhere(
                '(raza.nombre ILIKE :search OR raza.descripcion ILIKE :search OR especie.nombre ILIKE :search)',
                { search: searchTerm }
            );
        }

        // Filtro por especie
        if (filtros.especieId) {
            queryBuilder.andWhere('raza.especie_id = :especieId', { especieId: filtros.especieId });
        }

        // Filtro por estado activo
        if (filtros.activo !== undefined) {
            queryBuilder.andWhere('raza.activo = :activo', { activo: filtros.activo });
        }
    }

    private aplicarOrdenamiento(queryBuilder: any, campo: string, direccion: string): void {
        const mapeo = {
            'nombre': 'raza.nombre',
            'fecha_creacion': 'raza.fecha_creacion',
            'especie': 'especie.nombre',
        };

        const campoMapeado = mapeo[campo] || 'raza.nombre';
        queryBuilder.orderBy(campoMapeado, direccion);
    }

    private mapearRazaResponse(raza: Raza): RazaResponseDto {
        return {
            razaId: raza.razaId,
            especieId: raza.especieId,
            nombre: raza.nombre,
            descripcion: raza.descripcion,
            activo: raza.activo,
            fechaCreacion: raza.fechaCreacion,
            especieNombre: raza.especie?.nombre,
        };
    }

    private mapearRazaDetalleResponse(raza: Raza): RazaDetalleResponseDto {
        return {
            razaId: raza.razaId,
            nombre: raza.nombre,
            descripcion: raza.descripcion,
            activo: raza.activo,
            fechaCreacion: raza.fechaCreacion,
            especie: {
                especieId: raza.especie.especieId,
                nombre: raza.especie.nombre,
                activo: raza.especie.activo,
            },
        };
    }

    async crearRaza(createDto: CreateRazaDto): Promise<RazaDetalleResponseDto> {
        try {
            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId: createDto.especieId }
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${createDto.especieId} no encontrada`);
            }

            // Verificar que la especie esté activa
            if (!especie.activo) {
                throw new BadRequestException('No se puede crear una raza para una especie inactiva');
            }

            // Limpiar y normalizar el nombre
            const nombreNormalizado = createDto.nombre.trim();

            // Validar que el nombre no esté vacío después de trim
            if (!nombreNormalizado) {
                throw new BadRequestException('El nombre de la raza no puede estar vacío');
            }

            // Verificar unicidad del nombre por especie (case insensitive)
            const existingRaza = await this.razaRepository
                .createQueryBuilder('raza')
                .where('LOWER(TRIM(raza.nombre)) = LOWER(:nombre)', {
                    nombre: nombreNormalizado
                })
                .andWhere('raza.especieId = :especieId', {
                    especieId: createDto.especieId
                })
                .getOne();

            if (existingRaza) {
                throw new ConflictException('Ya existe una raza con este nombre para esta especie');
            }

            // Crear entidad con nombre normalizado
            const raza = this.razaRepository.create({
                ...createDto,
                nombre: nombreNormalizado,
                especie: especie,
                usuarioCreacion: createDto.usuarioCreacion || 'system',
                fechaCreacion: new Date(),
                fechaMod: new Date(),
            });

            // Guardar en base de datos
            const savedRaza = await this.razaRepository.save(raza);

            // Cargar relaciones para respuesta
            const razaConRelaciones = await this.razaRepository.findOne({
                where: { razaId: savedRaza.razaId },
                relations: ['especie']
            });

            // Retornar respuesta mapeada
            return this.mapearRazaDetalleResponse(razaConRelaciones);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof ConflictException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Manejo de errores de base de datos
            if (error instanceof QueryFailedError) {
                if (error['code'] === '23505') {
                    throw new ConflictException('Ya existe una raza con este nombre para esta especie');
                }
                if (error['code'] === '23503') {
                    throw new NotFoundException('Especie no encontrada');
                }
            }

            throw new HttpException(
                `Error al crear raza: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async obtenerRaza(razaId: number): Promise<RazaDetalleResponseDto> {
        try {
            // Verificar que la raza existe con sus relaciones
            const raza = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            if (!raza) {
                throw new NotFoundException(`Raza con ID ${razaId} no encontrada`);
            }

            // Retornar respuesta mapeada
            return this.mapearRazaDetalleResponse(raza);

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new HttpException(
                `Error al obtener raza: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async actualizarRaza(razaId: number, updateDto: UpdateRazaDto): Promise<RazaDetalleResponseDto> {
        try {
            // Verificar que la raza existe
            const raza = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            if (!raza) {
                throw new NotFoundException(`Raza con ID ${razaId} no encontrada`);
            }

            // Si se está cambiando la especie, verificar que exista
            let especie = raza.especie;
            if (updateDto.especieId && updateDto.especieId !== raza.especieId) {
                const nuevaEspecie = await this.especieRepository.findOne({
                    where: { especieId: updateDto.especieId }
                });

                if (!nuevaEspecie) {
                    throw new NotFoundException(`Especie con ID ${updateDto.especieId} no encontrada`);
                }

                if (!nuevaEspecie.activo) {
                    throw new BadRequestException('No se puede asignar la raza a una especie inactiva');
                }

                especie = nuevaEspecie;
            }

            // Verificar unicidad del nombre por especie
            if (updateDto.nombre) {
                const nombreNormalizado = updateDto.nombre.trim();

                // Validar que el nombre no esté vacío después de trim
                if (!nombreNormalizado) {
                    throw new BadRequestException('El nombre de la raza no puede estar vacío');
                }

                // Normalizar el nombre actual para comparación
                const nombreActualNormalizado = raza.nombre.trim().toLowerCase();
                const nuevoNombreNormalizado = nombreNormalizado.toLowerCase();

                // Determinar especie para la validación (puede estar cambiando)
                const especieIdParaValidacion = especie.especieId;

                // Solo verificar si el nombre cambió (case insensitive)
                if (nuevoNombreNormalizado !== nombreActualNormalizado ||
                    especieIdParaValidacion !== raza.especieId) {

                    const existingRaza = await this.razaRepository
                        .createQueryBuilder('raza')
                        .where('LOWER(TRIM(raza.nombre)) = LOWER(:nombre)', {
                            nombre: nombreNormalizado
                        })
                        .andWhere('raza.especieId = :especieId', {
                            especieId: especieIdParaValidacion
                        })
                        .andWhere('raza.razaId != :razaId', { razaId })
                        .getOne();

                    if (existingRaza) {
                        throw new ConflictException('Ya existe una raza con este nombre para esta especie');
                    }
                }

                // Actualizar el nombre normalizado
                updateDto.nombre = nombreNormalizado;
            }

            // Preparar datos para actualizar
            const datosActualizacion: any = {
                ...updateDto,
                especie: especie,
                fechaMod: new Date(),
                usuarioMod: updateDto.usuarioMod || 'system',
            };

            // Actualizar raza
            await this.razaRepository.update(razaId, datosActualizacion);

            // Obtener la raza actualizada con relaciones
            const razaActualizada = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            return this.mapearRazaDetalleResponse(razaActualizada);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof ConflictException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Manejo de errores de base de datos
            if (error instanceof QueryFailedError) {
                if (error['code'] === '23505') {
                    throw new ConflictException('Ya existe una raza con este nombre para esta especie');
                }
                if (error['code'] === '23503') {
                    throw new NotFoundException('Especie no encontrada');
                }
            }

            throw new HttpException(
                `Error al actualizar raza: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async eliminarRaza(deleteDto: DeleteRazaDto): Promise<{ mensaje: string }> {
        try {
            const { razaId, usuarioMod } = deleteDto;

            // Verificar que la raza existe
            const raza = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['mascotas']
            });

            if (!raza) {
                throw new NotFoundException(`Raza con ID ${razaId} no encontrada`);
            }

            // Verificar si tiene mascotas asociadas
            if (raza.mascotas && raza.mascotas.length > 0) {
                throw new ConflictException(
                    'No se puede eliminar la raza porque tiene mascotas asociadas'
                );
            }

            // Verificar si tiene mascotas en la base de datos
            const tieneMascotas = await this.tieneMascotas(razaId);
            if (tieneMascotas) {
                throw new ConflictException(
                    'No se puede eliminar la raza porque tiene mascotas asociadas'
                );
            }

            // Eliminar físicamente
            await this.razaRepository.delete(razaId);

            return {
                mensaje: `Raza con ID ${razaId} eliminada exitosamente`
            };

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }

            if (error instanceof QueryFailedError) {
                if (error['code'] === '23503') {
                    throw new ConflictException(
                        'No se puede eliminar la raza porque tiene registros relacionados'
                    );
                }
            }

            throw new HttpException(
                `Error al eliminar raza: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async inactivarRaza(inactivarDto: InactivarRazaDto): Promise<RazaDetalleResponseDto> {
        try {
            const { razaId, usuarioMod } = inactivarDto;

            // Verificar que la raza existe
            const raza = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            if (!raza) {
                throw new NotFoundException(`Raza con ID ${razaId} no encontrada`);
            }

            // Verificar si ya está inactiva
            if (!raza.activo) {
                throw new BadRequestException(`La raza con ID ${razaId} ya está inactiva`);
            }

            // Verificar si la especie está activa
            if (!raza.especie.activo) {
                throw new BadRequestException('No se puede inactivar una raza de una especie inactiva');
            }

            // Verificar si tiene mascotas activas
            const tieneMascotasActivas = await this.tieneMascotasActivas(razaId);
            if (tieneMascotasActivas) {
                throw new ConflictException(
                    'No se puede inactivar la raza porque tiene mascotas activas asociadas'
                );
            }

            // Actualizar a inactivo
            await this.razaRepository.update(razaId, {
                activo: false,
                fechaMod: new Date(),
                usuarioMod: usuarioMod || 'system',
            });

            // Obtener la raza actualizada
            const razaActualizada = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            return this.mapearRazaDetalleResponse(razaActualizada);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException) {
                throw error;
            }

            throw new HttpException(
                `Error al inactivar raza: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async reactivarRaza(razaId: number, usuarioMod?: string): Promise<RazaDetalleResponseDto> {
        try {
            // Verificar que la raza existe
            const raza = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            if (!raza) {
                throw new NotFoundException(`Raza con ID ${razaId} no encontrada`);
            }

            // Verificar si ya está activa
            if (raza.activo) {
                throw new BadRequestException(`La raza con ID ${razaId} ya está activa`);
            }

            // Verificar si la especie está activa
            if (!raza.especie.activo) {
                throw new BadRequestException('No se puede reactivar una raza de una especie inactiva');
            }

            // Actualizar a activo
            await this.razaRepository.update(razaId, {
                activo: true,
                fechaMod: new Date(),
                usuarioMod: usuarioMod || 'system',
            });

            // Obtener la raza actualizada
            const razaActualizada = await this.razaRepository.findOne({
                where: { razaId },
                relations: ['especie']
            });

            return this.mapearRazaDetalleResponse(razaActualizada);

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException(
                `Error al reactivar raza: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async obtenerRazasPorEspecie(especieId: number): Promise<RazaResponseDto[]> {
        try {
            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId }
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${especieId} no encontrada`);
            }

            // Obtener razas de la especie
            const razas = await this.razaRepository.find({
                where: {
                    especieId,
                    activo: true
                },
                order: { nombre: 'ASC' }
            });

            // Mapear respuesta
            return razas.map(raza => this.mapearRazaResponse(raza));

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new HttpException(
                `Error al obtener razas por especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Método para verificar si la raza tiene mascotas
    private async tieneMascotas(razaId: number): Promise<boolean> {
        try {
            const connection = this.razaRepository.manager.connection;

            const query = `
                SELECT EXISTS (
                    SELECT 1 
                    FROM mascota 
                    WHERE raza_id = $1
                    LIMIT 1
                ) as tiene_mascotas
            `;

            const result = await connection.query(query, [razaId]);
            return result[0]?.tiene_mascotas === true;

        } catch (error) {
            console.error(`Error al verificar mascotas de raza ${razaId}:`, error);
            return false;
        }
    }

    // Método para verificar si la raza tiene mascotas activas
    private async tieneMascotasActivas(razaId: number): Promise<boolean> {
        try {
            const connection = this.razaRepository.manager.connection;

            const query = `
                SELECT EXISTS (
                    SELECT 1 
                    FROM mascota 
                    WHERE raza_id = $1 
                    AND activo = true
                    LIMIT 1
                ) as tiene_mascotas_activas
            `;

            const result = await connection.query(query, [razaId]);
            return result[0]?.tiene_mascotas_activas === true;

        } catch (error) {
            console.error(`Error al verificar mascotas activas de raza ${razaId}:`, error);
            return false;
        }
    }
}