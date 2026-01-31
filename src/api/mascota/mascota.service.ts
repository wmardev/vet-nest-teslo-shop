import {
    Injectable,
    HttpException,
    HttpStatus,
    ConflictException,
    BadRequestException,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, Not } from 'typeorm';
import {
    ListMascotasResponseDto,
    MascotaResponseDto,
    MascotaSimpleResponseDto
} from './dtos/mascota-response.dto';
import { ListMascotasRequestDto } from './dtos/mascota-list.dto';
import { Mascota } from './entity/mascota.entity';
import { CreateMascotaDto } from './dtos/mascota-create.dto';
import { UpdateMascotaDto } from './dtos/mascota-update.dto';
import { DeleteMascotaDto, InactivarMascotaDto } from './dtos/mascota-delete.dto';
import { Cliente } from '../cliente/entity/cliente.entity';
import { Especie } from '../especie/entity/especie.entity';
import { Raza } from '../raza/entity/raza.entity';

@Injectable()
export class MascotaService {
    constructor(
        @InjectRepository(Mascota)
        private mascotaRepository: Repository<Mascota>,
        @InjectRepository(Cliente)
        private clienteRepository: Repository<Cliente>,
        @InjectRepository(Especie)
        private especieRepository: Repository<Especie>,
        @InjectRepository(Raza)
        private razaRepository: Repository<Raza>,
    ) { }

    async listarMascotas(request: ListMascotasRequestDto): Promise<ListMascotasResponseDto> {
        try {
            const { paginacion = {}, filtros = {}, ordenamiento = {} } = request;

            // Configurar paginación
            const pagina = paginacion.pagina || 1;
            const limite = paginacion.limite || 25;
            const offset = paginacion.offset || (pagina - 1) * limite;

            // Crear query builder con joins
            const queryBuilder = this.mascotaRepository.createQueryBuilder('mascota')
                .leftJoinAndSelect('mascota.cliente', 'cliente')
                .leftJoinAndSelect('mascota.especie', 'especie')
                .leftJoinAndSelect('mascota.raza', 'raza');

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
            const mascotas = await queryBuilder.getMany();

            // Mapear respuesta
            const data = mascotas.map(mascota => this.mapearMascotaResponse(mascota));

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
                `Error al listar mascotas: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private aplicarFiltros(queryBuilder: any, filtros: any): void {
        // Filtro de búsqueda general
        if (filtros.search) {
            const searchTerm = `%${filtros.search}%`;
            queryBuilder.andWhere(
                '(mascota.nombre ILIKE :search OR mascota.chip ILIKE :search OR ' +
                'mascota.pelaje ILIKE :search OR mascota.descripcion ILIKE :search OR ' +
                'cliente.nombre ILIKE :search OR especie.nombre ILIKE :search OR raza.nombre ILIKE :search)',
                { search: searchTerm }
            );
        }

        // Filtro por cliente
        if (filtros.clienteId) {
            queryBuilder.andWhere('mascota.cliente_id = :clienteId', { clienteId: filtros.clienteId });
        }

        // Filtro por especie
        if (filtros.especieId) {
            queryBuilder.andWhere('mascota.especie_id = :especieId', { especieId: filtros.especieId });
        }

        // Filtro por raza
        if (filtros.razaId) {
            queryBuilder.andWhere('mascota.raza_id = :razaId', { razaId: filtros.razaId });
        }

        // Filtro por estado activo
        if (filtros.activo !== undefined) {
            queryBuilder.andWhere('mascota.activo = :activo', { activo: filtros.activo });
        }

        // Filtro por sexo
        if (filtros.sexo) {
            queryBuilder.andWhere('mascota.sexo = :sexo', { sexo: filtros.sexo });
        }

        // Filtro por chip
        if (filtros.chip) {
            queryBuilder.andWhere('mascota.chip ILIKE :chip', { chip: `%${filtros.chip}%` });
        }

        // Filtro por rango de fechas de nacimiento
        if (filtros.fechaNacimientoDesde && filtros.fechaNacimientoHasta) {
            queryBuilder.andWhere('mascota.fecha_nacimiento BETWEEN :desde AND :hasta', {
                desde: filtros.fechaNacimientoDesde,
                hasta: filtros.fechaNacimientoHasta,
            });
        } else if (filtros.fechaNacimientoDesde) {
            queryBuilder.andWhere('mascota.fecha_nacimiento >= :desde', {
                desde: filtros.fechaNacimientoDesde,
            });
        } else if (filtros.fechaNacimientoHasta) {
            queryBuilder.andWhere('mascota.fecha_nacimiento <= :hasta', {
                hasta: filtros.fechaNacimientoHasta,
            });
        }
    }

    private aplicarOrdenamiento(queryBuilder: any, campo: string, direccion: string): void {
        const mapeo = {
            'nombre': 'mascota.nombre',
            'fecha_creacion': 'mascota.fecha_creacion',
            'fecha_nacimiento': 'mascota.fecha_nacimiento',
            'cliente': 'cliente.nombre',
            'especie': 'especie.nombre',
            'raza': 'raza.nombre',
        };

        const campoMapeado = mapeo[campo] || 'mascota.nombre';
        queryBuilder.orderBy(campoMapeado, direccion);
    }

    private mapearMascotaResponse(mascota: Mascota): MascotaResponseDto {
        return {
            mascotaId: mascota.mascotaId,
            nombre: mascota.nombre,
            fechaNacimiento: mascota.fechaNacimiento,
            sexo: mascota.sexo,
            chip: mascota.chip,
            pelaje: mascota.pelaje,
            descripcion: mascota.descripcion,
            activo: mascota.activo,
            fechaCreacion: mascota.fechaCreacion,
            cliente: {
                clienteId: mascota.cliente?.clienteId,
                nombre: mascota.cliente?.nombre,
            },
            especie: {
                especieId: mascota.especie?.especieId,
                nombre: mascota.especie?.nombre,
            },
            raza: {
                razaId: mascota.raza?.razaId,
                nombre: mascota.raza?.nombre,
            },
        };
    }

    private mapearMascotaSimpleResponse(mascota: Mascota): MascotaSimpleResponseDto {
        return {
            mascotaId: mascota.mascotaId,
            nombre: mascota.nombre,
            fechaNacimiento: mascota.fechaNacimiento,
            sexo: mascota.sexo,
            chip: mascota.chip,
            activo: mascota.activo,
            fechaCreacion: mascota.fechaCreacion,
        };
    }

    async crearMascota(createDto: CreateMascotaDto): Promise<MascotaResponseDto> {
        try {
            // Verificar que el cliente existe
            const cliente = await this.clienteRepository.findOne({
                where: { clienteId: createDto.clienteId }
            });

            if (!cliente) {
                throw new NotFoundException(`Cliente con ID ${createDto.clienteId} no encontrado`);
            }

            // Verificar que el cliente esté activo
            if (!cliente.activo) {
                throw new BadRequestException('No se puede crear una mascota para un cliente inactivo');
            }

            // Verificar que la especie existe
            const especie = await this.especieRepository.findOne({
                where: { especieId: createDto.especieId }
            });

            if (!especie) {
                throw new NotFoundException(`Especie con ID ${createDto.especieId} no encontrada`);
            }

            // Verificar que la especie esté activa
            if (!especie.activo) {
                throw new BadRequestException('No se puede crear una mascota de una especie inactiva');
            }

            // Verificar que la raza existe
            const raza = await this.razaRepository.findOne({
                where: { razaId: createDto.razaId },
                relations: ['especie']
            });

            if (!raza) {
                throw new NotFoundException(`Raza con ID ${createDto.razaId} no encontrada`);
            }

            // Verificar que la raza esté activa
            if (!raza.activo) {
                throw new BadRequestException('No se puede crear una mascota de una raza inactiva');
            }

            // Verificar que la raza pertenezca a la especie
            if (raza.especieId !== createDto.especieId) {
                throw new BadRequestException('La raza seleccionada no pertenece a la especie especificada');
            }

            // Verificar unicidad del chip si se proporciona
            if (createDto.chip) {
                const existingChip = await this.mascotaRepository.findOne({
                    where: { chip: createDto.chip }
                });
                if (existingChip) {
                    throw new ConflictException('Ya existe una mascota con este número de chip');
                }
            }

            // Crear entidad
            const mascota = this.mascotaRepository.create({
                ...createDto,
                cliente: cliente,
                especie: especie,
                raza: raza,
                fechaNacimiento: createDto.fechaNacimiento ? new Date(createDto.fechaNacimiento) : null,
                usuarioCreacion: createDto.usuarioCreacion || 'system',
                fechaCreacion: new Date(),
                fechaMod: new Date(),
            });

            // Guardar en base de datos
            const savedMascota = await this.mascotaRepository.save(mascota);

            // Cargar relaciones para respuesta
            const mascotaConRelaciones = await this.mascotaRepository.findOne({
                where: { mascotaId: savedMascota.mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            // Retornar respuesta mapeada
            return this.mapearMascotaResponse(mascotaConRelaciones);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof ConflictException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Manejo de errores de base de datos
            if (error instanceof QueryFailedError) {
                if (error['code'] === '23505') {
                    if (error['detail']?.includes('chip')) {
                        throw new ConflictException('Ya existe una mascota con este número de chip');
                    }
                }
                if (error['code'] === '23503') {
                    const detail = error['detail'] || '';
                    if (detail.includes('cliente_id')) {
                        throw new NotFoundException('Cliente no encontrado');
                    }
                    if (detail.includes('especie_id')) {
                        throw new NotFoundException('Especie no encontrada');
                    }
                    if (detail.includes('raza_id')) {
                        throw new NotFoundException('Raza no encontrada');
                    }
                }
            }

            throw new HttpException(
                `Error al crear mascota: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async obtenerMascota(mascotaId: number): Promise<MascotaResponseDto> {
        try {
            // Verificar que la mascota existe con sus relaciones
            const mascota = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            if (!mascota) {
                throw new NotFoundException(`Mascota con ID ${mascotaId} no encontrada`);
            }

            // Retornar respuesta mapeada
            return this.mapearMascotaResponse(mascota);

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new HttpException(
                `Error al obtener mascota: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async obtenerMascotasPorCliente(clienteId: number): Promise<MascotaSimpleResponseDto[]> {
        try {
            // Verificar que el cliente existe
            const cliente = await this.clienteRepository.findOne({
                where: { clienteId }
            });

            if (!cliente) {
                throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
            }

            // Obtener mascotas del cliente
            const mascotas = await this.mascotaRepository.find({
                where: {
                    clienteId,
                    activo: true
                },
                relations: ['especie', 'raza'],
                order: { nombre: 'ASC' }
            });

            // Mapear respuesta
            return mascotas.map(mascota => this.mapearMascotaSimpleResponse(mascota));

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new HttpException(
                `Error al obtener mascotas por cliente: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async actualizarMascota(mascotaId: number, updateDto: UpdateMascotaDto): Promise<MascotaResponseDto> {
        try {
            // Verificar que la mascota existe
            const mascota = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            if (!mascota) {
                throw new NotFoundException(`Mascota con ID ${mascotaId} no encontrada`);
            }

            // Verificar que el cliente existe si se está actualizando
            let cliente = mascota.cliente;
            if (updateDto.clienteId && updateDto.clienteId !== mascota.clienteId) {
                const nuevoCliente = await this.clienteRepository.findOne({
                    where: { clienteId: updateDto.clienteId }
                });

                if (!nuevoCliente) {
                    throw new NotFoundException(`Cliente con ID ${updateDto.clienteId} no encontrado`);
                }

                if (!nuevoCliente.activo) {
                    throw new BadRequestException('No se puede asignar la mascota a un cliente inactivo');
                }

                cliente = nuevoCliente;
            }

            // Verificar que la especie existe si se está actualizando
            let especie = mascota.especie;
            if (updateDto.especieId && updateDto.especieId !== mascota.especieId) {
                const nuevaEspecie = await this.especieRepository.findOne({
                    where: { especieId: updateDto.especieId }
                });

                if (!nuevaEspecie) {
                    throw new NotFoundException(`Especie con ID ${updateDto.especieId} no encontrada`);
                }

                if (!nuevaEspecie.activo) {
                    throw new BadRequestException('No se puede asignar la mascota a una especie inactiva');
                }

                especie = nuevaEspecie;
            }

            // Verificar que la raza existe si se está actualizando
            let raza = mascota.raza;
            if (updateDto.razaId && updateDto.razaId !== mascota.razaId) {
                const nuevaRaza = await this.razaRepository.findOne({
                    where: { razaId: updateDto.razaId },
                    relations: ['especie']
                });

                if (!nuevaRaza) {
                    throw new NotFoundException(`Raza con ID ${updateDto.razaId} no encontrada`);
                }

                if (!nuevaRaza.activo) {
                    throw new BadRequestException('No se puede asignar la mascota a una raza inactiva');
                }

                // Verificar que la raza pertenezca a la especie (actual o nueva)
                const especieId = especie?.especieId || mascota.especieId;
                if (nuevaRaza.especieId !== especieId) {
                    throw new BadRequestException('La raza seleccionada no pertenece a la especie especificada');
                }

                raza = nuevaRaza;
            }

            // Verificar unicidad del chip si se está actualizando
            if (updateDto.chip && updateDto.chip !== mascota.chip) {
                const existingChip = await this.mascotaRepository.findOne({
                    where: {
                        chip: updateDto.chip,
                        mascotaId: Not(mascotaId) // Excluir la mascota actual
                    }
                });
                if (existingChip) {
                    throw new ConflictException('Ya existe otra mascota con este número de chip');
                }
            }

            // Preparar datos para actualizar
            const datosActualizacion: any = {
                ...updateDto,
                cliente: cliente,
                especie: especie,
                raza: raza,
                fechaMod: new Date(),
                usuarioMod: updateDto.usuarioMod || 'system',
            };

            // Manejar fecha de nacimiento si está presente
            if (updateDto.fechaNacimiento !== undefined) {
                datosActualizacion.fechaNacimiento = updateDto.fechaNacimiento
                    ? new Date(updateDto.fechaNacimiento)
                    : null;
            }

            // Actualizar mascota
            await this.mascotaRepository.update(mascotaId, datosActualizacion);

            // Obtener la mascota actualizada con relaciones
            const mascotaActualizada = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            return this.mapearMascotaResponse(mascotaActualizada);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof ConflictException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Manejo de errores de base de datos
            if (error instanceof QueryFailedError) {
                if (error['code'] === '23505') {
                    if (error['detail']?.includes('chip')) {
                        throw new ConflictException('Ya existe una mascota con este número de chip');
                    }
                }
                if (error['code'] === '23503') {
                    const detail = error['detail'] || '';
                    if (detail.includes('cliente_id')) {
                        throw new NotFoundException('Cliente no encontrado');
                    }
                    if (detail.includes('especie_id')) {
                        throw new NotFoundException('Especie no encontrada');
                    }
                    if (detail.includes('raza_id')) {
                        throw new NotFoundException('Raza no encontrada');
                    }
                }
            }

            throw new HttpException(
                `Error al actualizar mascota: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async eliminarMascota(deleteDto: DeleteMascotaDto): Promise<{ mensaje: string }> {
        try {
            const { mascotaId, usuarioMod } = deleteDto;

            // Verificar que la mascota existe
            const mascota = await this.mascotaRepository.findOne({
                where: { mascotaId }
            });

            if (!mascota) {
                throw new NotFoundException(`Mascota con ID ${mascotaId} no encontrada`);
            }

            // Verificar si tiene registros relacionados (ej: historial médico, citas, etc.)
            const tieneRegistros = await this.tieneRegistrosRelacionados(mascotaId);
            if (tieneRegistros) {
                throw new ConflictException(
                    'No se puede eliminar la mascota porque tiene registros relacionados'
                );
            }

            // Eliminar físicamente
            await this.mascotaRepository.delete(mascotaId);

            return {
                mensaje: `Mascota con ID ${mascotaId} eliminada exitosamente`
            };

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }

            if (error instanceof QueryFailedError) {
                if (error['code'] === '23503') {
                    throw new ConflictException(
                        'No se puede eliminar la mascota porque tiene registros relacionados'
                    );
                }
            }

            throw new HttpException(
                `Error al eliminar mascota: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async inactivarMascota(inactivarDto: InactivarMascotaDto): Promise<MascotaResponseDto> {
        try {
            const { mascotaId, usuarioMod } = inactivarDto;

            // Verificar que la mascota existe
            const mascota = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            if (!mascota) {
                throw new NotFoundException(`Mascota con ID ${mascotaId} no encontrada`);
            }

            // Verificar si ya está inactiva
            if (!mascota.activo) {
                throw new BadRequestException(`La mascota con ID ${mascotaId} ya está inactiva`);
            }

            // Verificar si el cliente está activo
            if (!mascota.cliente.activo) {
                throw new BadRequestException('No se puede inactivar una mascota de un cliente inactivo');
            }

            // Verificar si la especie está activa
            if (!mascota.especie.activo) {
                throw new BadRequestException('No se puede inactivar una mascota de una especie inactiva');
            }

            // Verificar si la raza está activa
            if (!mascota.raza.activo) {
                throw new BadRequestException('No se puede inactivar una mascota de una raza inactiva');
            }

            // Verificar si tiene registros activos relacionados
            const tieneRegistrosActivos = await this.tieneRegistrosActivosRelacionados(mascotaId);
            if (tieneRegistrosActivos) {
                throw new ConflictException(
                    'No se puede inactivar la mascota porque tiene registros activos relacionados'
                );
            }

            // Actualizar a inactivo
            await this.mascotaRepository.update(mascotaId, {
                activo: false,
                fechaMod: new Date(),
                usuarioMod: usuarioMod || 'system',
            });

            // Obtener la mascota actualizada
            const mascotaActualizada = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            return this.mapearMascotaResponse(mascotaActualizada);

        } catch (error) {
            if (error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException) {
                throw error;
            }

            throw new HttpException(
                `Error al inactivar mascota: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async reactivarMascota(mascotaId: number, usuarioMod?: string): Promise<MascotaResponseDto> {
        try {
            // Verificar que la mascota existe
            const mascota = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            if (!mascota) {
                throw new NotFoundException(`Mascota con ID ${mascotaId} no encontrada`);
            }

            // Verificar si ya está activa
            if (mascota.activo) {
                throw new BadRequestException(`La mascota con ID ${mascotaId} ya está activa`);
            }

            // Verificar si el cliente está activo
            if (!mascota.cliente.activo) {
                throw new BadRequestException('No se puede reactivar una mascota de un cliente inactivo');
            }

            // Verificar si la especie está activa
            if (!mascota.especie.activo) {
                throw new BadRequestException('No se puede reactivar una mascota de una especie inactiva');
            }

            // Verificar si la raza está activa
            if (!mascota.raza.activo) {
                throw new BadRequestException('No se puede reactivar una mascota de una raza inactiva');
            }

            // Actualizar a activo
            await this.mascotaRepository.update(mascotaId, {
                activo: true,
                fechaMod: new Date(),
                usuarioMod: usuarioMod || 'system',
            });

            // Obtener la mascota actualizada
            const mascotaActualizada = await this.mascotaRepository.findOne({
                where: { mascotaId },
                relations: ['cliente', 'especie', 'raza']
            });

            return this.mapearMascotaResponse(mascotaActualizada);

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException(
                `Error al reactivar mascota: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Método para verificar si la mascota tiene registros relacionados
    private async tieneRegistrosRelacionados(mascotaId: number): Promise<boolean> {
        try {
            const connection = this.mascotaRepository.manager.connection;

            // Lista de tablas que podrían tener relaciones con mascota
            const tablasRelacionadas = [
                'historial_medico',
                'cita',
                'vacuna',
                'consulta',
                'tratamiento'
                // Añade aquí todas las tablas que tengan foreign key a mascota
            ];

            // Verificar cada tabla
            for (const tabla of tablasRelacionadas) {
                try {
                    const query = `
                    SELECT EXISTS (
                        SELECT 1 
                        FROM ${tabla} 
                        WHERE mascota_id = $1
                        LIMIT 1
                    ) as tiene_registros
                `;

                    const result = await connection.query(query, [mascotaId]);

                    if (result[0]?.tiene_registros === true) {
                        return true; // Encontró una relación
                    }
                } catch (tableError) {
                    // Si la tabla no existe, continuar con la siguiente
                    console.warn(`Tabla ${tabla} no encontrada o sin relación con mascota`);
                    continue;
                }
            }

            return false; // No encontró relaciones en ninguna tabla

        } catch (error) {
            console.error(`Error al verificar relaciones de mascota ${mascotaId}:`, error);
            return false; // En caso de error, permitir la operación
        }
    }

    // Método para verificar si la mascota tiene registros activos relacionados
    private async tieneRegistrosActivosRelacionados(mascotaId: number): Promise<boolean> {
        try {
            const connection = this.mascotaRepository.manager.connection;

            // Lista de tablas que podrían tener relaciones activas con mascota
            const tablasRelacionadas = [
                'cita' // Ejemplo: citas pendientes
                // Añade aquí las tablas que tengan campo activo o estado
            ];

            for (const tabla of tablasRelacionadas) {
                try {
                    // Verificar si la tabla tiene campo 'activo'
                    const hasActiveField = await this.tieneCampoActivo(connection, tabla);

                    let query = '';
                    if (hasActiveField) {
                        query = `
                        SELECT EXISTS (
                            SELECT 1 
                            FROM ${tabla} 
                            WHERE mascota_id = $1
                            AND activo = true
                            LIMIT 1
                        ) as tiene_registros_activos
                    `;
                    } else {
                        query = `
                        SELECT EXISTS (
                            SELECT 1 
                            FROM ${tabla} 
                            WHERE mascota_id = $1
                            LIMIT 1
                        ) as tiene_registros_activos
                    `;
                    }

                    const result = await connection.query(query, [mascotaId]);

                    if (result[0]?.tiene_registros_activos === true) {
                        return true;
                    }
                } catch (tableError) {
                    console.warn(`Tabla ${tabla} no encontrada o sin relación con mascota`);
                    continue;
                }
            }

            return false;

        } catch (error) {
            console.error(`Error al verificar registros activos de mascota ${mascotaId}:`, error);
            return false;
        }
    }

    private async tieneCampoActivo(connection: any, tabla: string): Promise<boolean> {
        try {
            const query = `
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    AND column_name = 'activo'
                ) as tiene_campo_activo
            `;

            const result = await connection.query(query, [tabla]);
            return result[0]?.tiene_campo_activo === true;
        } catch (error) {
            return false;
        }
    }
}