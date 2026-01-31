import { Injectable, HttpException, HttpStatus, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, ILike } from 'typeorm';
import { ListEspeciesResponseDto, EspecieResponseDto } from './dtos/especie-response.dto';
import { ListEspeciesRequestDto } from './dtos/especie-list.dto';
import { Especie } from './entity/especie.entity';
import { CreateEspecieDto } from './dtos/especie-create.dto';
import { UpdateEspecieDto } from './dtos/especie-update.dto';
import { DeleteEspecieDto, InactivarEspecieDto } from './dtos/especie-delete.dto';

@Injectable()
export class EspecieService {
    constructor(
        @InjectRepository(Especie)
        private especieRepository: Repository<Especie>,
    ) { }

    async listarEspecies(request: ListEspeciesRequestDto): Promise<ListEspeciesResponseDto> {
        try {
            const { paginacion = {}, filtros = {}, ordenamiento = {} } = request;

            // Configurar paginación
            const pagina = paginacion.pagina || 1;
            const limite = paginacion.limite || 25;
            const offset = paginacion.offset || (pagina - 1) * limite;

            // Crear query builder
            const queryBuilder = this.especieRepository.createQueryBuilder('especie');

            // Aplicar filtros
            this.aplicarFiltros(queryBuilder, filtros);

            // Contar total de registros
            const total = await queryBuilder.getCount();

            // Aplicar ordenamiento
            const campoOrden = ordenamiento.campo || 'nombre';
            const direccionOrden = ordenamiento.direccion?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            queryBuilder.orderBy(`especie.${this.mapearCampoOrden(campoOrden)}`, direccionOrden);

            // Aplicar paginación
            queryBuilder.skip(offset).take(limite);

            // Ejecutar consulta
            const especies = await queryBuilder.getMany();

            // Mapear respuesta
            const data = especies.map(especie => this.mapearEspecieResponse(especie));

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
                `Error al listar especies: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private aplicarFiltros(queryBuilder: any, filtros: any): void {
        // Filtro de búsqueda general
        if (filtros.search) {
            const searchTerm = `%${filtros.search}%`;
            queryBuilder.andWhere(
                '(especie.nombre ILIKE :search OR especie.descripcion ILIKE :search)',
                { search: searchTerm }
            );
        }

        // Filtro por estado activo
        if (filtros.activo !== undefined) {
            queryBuilder.andWhere('especie.activo = :activo', { activo: filtros.activo });
        }
    }

    private mapearCampoOrden(campo: string): string {
        const mapeo = {
            'nombre': 'nombre',
            'fecha_creacion': 'fecha_creacion',
        };
        return mapeo[campo] || 'nombre';
    }

    private mapearEspecieResponse(especie: Especie): EspecieResponseDto {
        return {
            especieId: especie.especieId,
            nombre: especie.nombre,
            descripcion: especie.descripcion,
            activo: especie.activo,
            fechaCreacion: especie.fechaCreacion,
        };
    }

    async crearEspecie(createDto: CreateEspecieDto): Promise<EspecieResponseDto> {
        try {
            // Limpiar y normalizar el nombre
            const nombreNormalizado = createDto.nombre.trim();

            // Validar que el nombre no esté vacío después de trim
            if (!nombreNormalizado) {
                throw new BadRequestException('El nombre de la especie no puede estar vacío');
            }

            // Verificar unicidad del nombre (case insensitive exacto)
            const existingEspecie = await this.especieRepository
                .createQueryBuilder('especie')
                .where('LOWER(TRIM(especie.nombre)) = LOWER(:nombre)', {
                    nombre: nombreNormalizado
                })
                .getOne();

            if (existingEspecie) {
                throw new ConflictException('Ya existe una especie con este nombre');
            }

            // Crear entidad con nombre normalizado
            const especie = this.especieRepository.create({
                ...createDto,
                nombre: nombreNormalizado,
                usuarioCreacion: createDto.usuarioCreacion || 'system',
                fechaCreacion: new Date(),
                fechaMod: new Date(),
            });

            // Guardar en base de datos
            const savedEspecie = await this.especieRepository.save(especie);

            // Retornar respuesta mapeada
            return this.mapearEspecieResponse(savedEspecie);

        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }

            // Manejo de errores de base de datos
            if (error instanceof QueryFailedError) {
                if (error['code'] === '23505') {
                    throw new ConflictException('Ya existe una especie con este nombre');
                }
            }

            throw new HttpException(
                `Error al crear especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async obtenerEspecie(especieId: number): Promise<EspecieResponseDto> {
        try {
            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId },
                relations: ['razas']
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${especieId} no encontrada`);
            }

            // Retornar respuesta mapeada
            return this.mapearEspecieResponse(especie);

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new HttpException(
                `Error al obtener especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async actualizarEspecie(especieId: number, updateDto: UpdateEspecieDto): Promise<EspecieResponseDto> {
        try {
            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId }
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${especieId} no encontrada`);
            }

            // Verificar unicidad del nombre si se está actualizando
            if (updateDto.nombre) {
                const nombreNormalizado = updateDto.nombre.trim();

                // Validar que el nombre no esté vacío después de trim
                if (!nombreNormalizado) {
                    throw new BadRequestException('El nombre de la especie no puede estar vacío');
                }

                // Normalizar el nombre actual para comparación
                const nombreActualNormalizado = especie.nombre.trim().toLowerCase();
                const nuevoNombreNormalizado = nombreNormalizado.toLowerCase();

                // Solo verificar si el nombre cambió (case insensitive)
                if (nuevoNombreNormalizado !== nombreActualNormalizado) {
                    const existingEspecie = await this.especieRepository
                        .createQueryBuilder('especie')
                        .where('LOWER(TRIM(especie.nombre)) = LOWER(:nombre)', {
                            nombre: nombreNormalizado
                        })
                        .andWhere('especie.especieId != :especieId', { especieId })
                        .getOne();

                    if (existingEspecie) {
                        throw new ConflictException('Ya existe otra especie con este nombre');
                    }
                }

                // Actualizar el nombre normalizado
                updateDto.nombre = nombreNormalizado;
            }

            // Preparar datos para actualizar
            const datosActualizacion: any = {
                ...updateDto,
                fechaMod: new Date(),
                usuarioMod: updateDto.usuarioMod || 'system',
            };

            // Actualizar especie
            await this.especieRepository.update(especieId, datosActualizacion);

            // Obtener la especie actualizada
            const especieActualizada = await this.especieRepository.findOne({
                where: { especieId }
            });

            return this.mapearEspecieResponse(especieActualizada);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof ConflictException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Manejo de errores de base de datos
            if (error instanceof QueryFailedError) {
                if (error['code'] === '23505') {
                    throw new ConflictException('Ya existe una especie con este nombre');
                }
            }

            throw new HttpException(
                `Error al actualizar especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async eliminarEspecie(deleteDto: DeleteEspecieDto): Promise<{ mensaje: string }> {
        try {
            const { especieId, usuarioMod } = deleteDto;

            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId },
                relations: ['razas']
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${especieId} no encontrada`);
            }

            // Verificar si tiene razas asociadas
            if (especie.razas && especie.razas.length > 0) {
                throw new ConflictException(
                    'No se puede eliminar la especie porque tiene razas asociadas'
                );
            }

            // Verificar si tiene mascotas (a través de relaciones)
            const tieneMascotas = await this.tieneMascotas(especieId);
            if (tieneMascotas) {
                throw new ConflictException(
                    'No se puede eliminar la especie porque tiene mascotas asociadas'
                );
            }

            // Eliminar físicamente
            await this.especieRepository.delete(especieId);

            return {
                mensaje: `Especie con ID ${especieId} eliminada exitosamente`
            };

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }

            if (error instanceof QueryFailedError) {
                if (error['code'] === '23503') {
                    throw new ConflictException(
                        'No se puede eliminar la especie porque tiene registros relacionados'
                    );
                }
            }

            throw new HttpException(
                `Error al eliminar especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async inactivarEspecie(inactivarDto: InactivarEspecieDto): Promise<EspecieResponseDto> {
        try {
            const { especieId, usuarioMod } = inactivarDto;

            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId }
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${especieId} no encontrada`);
            }

            // Verificar si ya está inactiva
            if (!especie.activo) {
                throw new BadRequestException(`La especie con ID ${especieId} ya está inactiva`);
            }

            // Verificar si tiene mascotas activas
            const tieneMascotasActivas = await this.tieneMascotasActivas(especieId);
            if (tieneMascotasActivas) {
                throw new ConflictException(
                    'No se puede inactivar la especie porque tiene mascotas activas asociadas'
                );
            }

            // Actualizar a inactivo
            await this.especieRepository.update(especieId, {
                activo: false,
                fechaMod: new Date(),
                usuarioMod: usuarioMod || 'system',
            });

            // Obtener la especie actualizada
            const especieActualizada = await this.especieRepository.findOne({
                where: { especieId }
            });

            return this.mapearEspecieResponse(especieActualizada);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException) {
                throw error;
            }

            throw new HttpException(
                `Error al inactivar especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async reactivarEspecie(especieId: number, usuarioMod?: string): Promise<EspecieResponseDto> {
        try {
            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId }
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${especieId} no encontrada`);
            }

            // Verificar si ya está activa
            if (especie.activo) {
                throw new BadRequestException(`La especie con ID ${especieId} ya está activa`);
            }

            // Actualizar a activo
            await this.especieRepository.update(especieId, {
                activo: true,
                fechaMod: new Date(),
                usuarioMod: usuarioMod || 'system',
            });

            // Obtener la especie actualizada
            const especieActualizada = await this.especieRepository.findOne({
                where: { especieId }
            });

            return this.mapearEspecieResponse(especieActualizada);

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException(
                `Error al reactivar especie: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Método para verificar si la especie tiene mascotas
    private async tieneMascotas(especieId: number): Promise<boolean> {
        try {
            const connection = this.especieRepository.manager.connection;

            const query = `
                SELECT EXISTS (
                    SELECT 1 
                    FROM mascota 
                    WHERE especie_id = $1
                    LIMIT 1
                ) as tiene_mascotas
            `;

            const result = await connection.query(query, [especieId]);
            return result[0]?.tiene_mascotas === true;

        } catch (error) {
            console.error(`Error al verificar mascotas de especie ${especieId}:`, error);
            return false;
        }
    }

    // Método para verificar si la especie tiene mascotas activas
    private async tieneMascotasActivas(especieId: number): Promise<boolean> {
        try {
            const connection = this.especieRepository.manager.connection;

            const query = `
                SELECT EXISTS (
                    SELECT 1 
                    FROM mascota 
                    WHERE especie_id = $1 
                    AND activo = true
                    LIMIT 1
                ) as tiene_mascotas_activas
            `;

            const result = await connection.query(query, [especieId]);
            return result[0]?.tiene_mascotas_activas === true;

        } catch (error) {
            console.error(`Error al verificar mascotas activas de especie ${especieId}:`, error);
            return false;
        }
    }
}