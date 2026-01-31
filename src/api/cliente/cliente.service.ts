import {
  Injectable,
  HttpException,
  HttpStatus,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, ILike, QueryFailedError } from 'typeorm';
import {
  ListClientesResponseDto,
  ClienteResponseDto,
} from './dtos/cliente-response.dto';
import { ListClientesRequestDto } from './dtos/cliente-list.dto';
import { Cliente } from './entity/cliente.entity';
import { CreateClienteDto } from './dtos/cliente-create.dto';
import { UpdateClienteDto } from './dtos/cliente-update.dto';
import {
  DeleteClienteDto,
  InactivarClienteDto,
} from './dtos/cliente-delete.dto';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async listarClientes(
    request: ListClientesRequestDto,
  ): Promise<ListClientesResponseDto> {
    try {
      const { paginacion = {}, filtros = {}, ordenamiento = {} } = request;

      // Configurar paginación
      const pagina = paginacion.pagina || 1;
      const limite = paginacion.limite || 25;
      const offset = paginacion.offset || (pagina - 1) * limite;

      // Crear query builder
      const queryBuilder = this.clienteRepository.createQueryBuilder('cliente');

      // Aplicar filtros
      this.aplicarFiltros(queryBuilder, filtros);

      // Contar total de registros
      const total = await queryBuilder.getCount();

      // Aplicar ordenamiento
      const campoOrden = ordenamiento.campo || 'nombre';
      const direccionOrden =
        ordenamiento.direccion?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      queryBuilder.orderBy(
        `cliente.${this.mapearCampoOrden(campoOrden)}`,
        direccionOrden,
      );

      // Aplicar paginación
      queryBuilder.skip(offset).take(limite);

      // Ejecutar consulta
      const clientes = await queryBuilder.getMany();

      // Mapear respuesta
      const data = clientes.map((cliente) =>
        this.mapearClienteResponse(cliente),
      );

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
        `Error al listar clientes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private aplicarFiltros(queryBuilder: any, filtros: any): void {
    if (filtros.activo === undefined) {
      queryBuilder.andWhere('cliente.activo = :activo', { activo: true });
    }
    // Filtro de búsqueda general
    if (filtros.search) {
      const searchTerm = `%${filtros.search}%`;
      queryBuilder.andWhere(
        '(cliente.nombre ILIKE :search OR cliente.cedula ILIKE :search OR cliente.ruc ILIKE :search)',
        { search: searchTerm },
      );
    }

    // Filtros exactos
    if (filtros.cedula) {
      queryBuilder.andWhere('cliente.cedula = :cedula', {
        cedula: filtros.cedula,
      });
    }

    if (filtros.ruc) {
      queryBuilder.andWhere('cliente.ruc = :ruc', { ruc: filtros.ruc });
    }

    if (filtros.activo !== undefined) {
      queryBuilder.andWhere('cliente.activo = :activo', {
        activo: filtros.activo,
      });
    }

    // Filtros parciales
    if (filtros.telefono) {
      queryBuilder.andWhere('cliente.telefono ILIKE :telefono', {
        telefono: `%${filtros.telefono}%`,
      });
    }

    if (filtros.direccion) {
      queryBuilder.andWhere('cliente.direccion ILIKE :direccion', {
        direccion: `%${filtros.direccion}%`,
      });
    }

    // Filtro por rango de fechas
    if (filtros.fechaNacimientoDesde && filtros.fechaNacimientoHasta) {
      queryBuilder.andWhere(
        'cliente.fecha_nacimiento BETWEEN :desde AND :hasta',
        {
          desde: filtros.fechaNacimientoDesde,
          hasta: filtros.fechaNacimientoHasta,
        },
      );
    } else if (filtros.fechaNacimientoDesde) {
      queryBuilder.andWhere('cliente.fecha_nacimiento >= :desde', {
        desde: filtros.fechaNacimientoDesde,
      });
    } else if (filtros.fechaNacimientoHasta) {
      queryBuilder.andWhere('cliente.fecha_nacimiento <= :hasta', {
        hasta: filtros.fechaNacimientoHasta,
      });
    }
  }

  private mapearCampoOrden(campo: string): string {
    const mapeo = {
      nombre: 'nombre',
      cedula: 'cedula',
      ruc: 'ruc',
      telefono: 'telefono',
      fecha_creacion: 'fecha_creacion',
      fecha_nacimiento: 'fecha_nacimiento',
    };
    return mapeo[campo] || 'nombre';
  }

  private mapearClienteResponse(cliente: Cliente): ClienteResponseDto {
    return {
      clienteId: cliente.clienteId,
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      ruc: cliente.ruc,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento,
      direccion: cliente.direccion,
      activo: cliente.activo,
      fechaCreacion: cliente.fechaCreacion,
      usuarioCreacion: cliente.usuarioCreacion,
      fechaMod: cliente.fechaMod,
      usuarioMod: cliente.usuarioMod,
    };
  }

  async crearCliente(
    createDto: CreateClienteDto,
    user: User,
  ): Promise<ClienteResponseDto> {
    try {
      // Validar que al menos cédula o RUC estén presentes si es necesario (puedes ajustar según tus reglas)
      if (!createDto.cedula) {
        throw new BadRequestException('Debe proporcionar cédula');
      }

      // Verificar unicidad de cédula
      if (createDto.cedula) {
        const existingCedula = await this.clienteRepository.findOne({
          where: { cedula: createDto.cedula },
        });
        if (existingCedula) {
          throw new ConflictException('Ya existe un cliente con esta cédula');
        }
      }

      // Verificar unicidad de RUC
      if (createDto.ruc) {
        const existingRuc = await this.clienteRepository.findOne({
          where: { ruc: createDto.ruc },
        });
        if (existingRuc) {
          throw new ConflictException('Ya existe un cliente con este RUC');
        }
      }

      // Crear entidad
      const cliente = this.clienteRepository.create({
        ...createDto,
        fechaNacimiento: createDto.fechaNacimiento || null,
        ubicacionGps: createDto.ubicacionGps || null,
        usuarioCreacion: user.email || 'admin',
        fechaCreacion: new Date(),
        fechaMod: null,
        usuarioMod: null,
      });

      // Guardar en base de datos
      const savedCliente = await this.clienteRepository.save(cliente);

      // Retornar respuesta mapeada
      return this.mapearClienteResponse(savedCliente);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Manejo de errores de base de datos
      if (error instanceof QueryFailedError) {
        // PostgreSQL unique violation error code
        if (error['code'] === '23505') {
          const detail = error['detail'] || '';
          if (detail.includes('cedula')) {
            throw new ConflictException('Ya existe un cliente con esta cédula');
          }
          if (detail.includes('ruc')) {
            throw new ConflictException('Ya existe un cliente con este RUC');
          }
        }
      }

      throw new HttpException(
        `Error al crear cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para obtener cliente por ID
  async obtenerCliente(clienteId: number): Promise<ClienteResponseDto> {
    try {
      // Verificar que el cliente existe
      const cliente = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }

      // Retornar respuesta mapeada
      return this.mapearClienteResponse(cliente);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        `Error al obtener cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async actualizarCliente(
    clienteId: number,
    updateDto: UpdateClienteDto,
    user: User
  ): Promise<ClienteResponseDto> {
    try {
      // Verificar que el cliente existe
      const cliente = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }

      // Verificar unicidad de cédula si se está actualizando
      if (updateDto.cedula && updateDto.cedula !== cliente.cedula) {
        const existingCedula = await this.clienteRepository.findOne({
          where: { cedula: updateDto.cedula },
        });
        if (existingCedula && existingCedula.clienteId !== clienteId) {
          throw new ConflictException('Ya existe otro cliente con esta cédula');
        }
      }

      // Verificar unicidad de RUC si se está actualizando
      if (updateDto.ruc && updateDto.ruc !== cliente.ruc) {
        const existingRuc = await this.clienteRepository.findOne({
          where: { ruc: updateDto.ruc },
        });
        if (existingRuc && existingRuc.clienteId !== clienteId) {
          throw new ConflictException('Ya existe otro cliente con este RUC');
        }
      }

      // Preparar datos para actualizar
      const datosActualizacion: any = {
        ...updateDto,
        fechaMod: new Date(),
        usuarioMod: user.email || 'admin',
      };

      // Manejar fecha de nacimiento si está presente
      if (updateDto.fechaNacimiento !== undefined) {
        datosActualizacion.fechaNacimiento = updateDto.fechaNacimiento || null;
      }

      // Actualizar cliente
      await this.clienteRepository.update(clienteId, datosActualizacion);

      // Obtener el cliente actualizado
      const clienteActualizado = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      return this.mapearClienteResponse(clienteActualizado);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Manejo de errores de base de datos
      if (error instanceof QueryFailedError) {
        if (error['code'] === '23505') {
          const detail = error['detail'] || '';
          if (detail.includes('cedula')) {
            throw new ConflictException('Ya existe un cliente con esta cédula');
          }
          if (detail.includes('ruc')) {
            throw new ConflictException('Ya existe un cliente con este RUC');
          }
        }
      }

      throw new HttpException(
        `Error al actualizar cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para eliminar cliente (físico) - también actualizado para usar la misma verificación
  async eliminarCliente(
    deleteDto: DeleteClienteDto,
  ): Promise<{ mensaje: string }> {
    try {
      const { clienteId } = deleteDto;

      // Verificar que el cliente existe
      const cliente = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }

      // Verificar si tiene relaciones (usando el mismo método)
      const tieneRelaciones = await this.tieneRelaciones(clienteId);
      if (tieneRelaciones) {
        throw new ConflictException(
          'No se puede eliminar el cliente porque tiene registros relacionados con otras tablas.',
        );
      }

      // Eliminar físicamente
      await this.clienteRepository.delete(clienteId);

      return {
        mensaje: `Cliente con ID ${clienteId} eliminado exitosamente`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // También mantener la verificación por si hay error de FK
      if (error instanceof QueryFailedError) {
        if (error['code'] === '23503') {
          throw new ConflictException(
            'No se puede eliminar el cliente porque tiene registros relacionados con otras tablas.',
          );
        }
      }

      throw new HttpException(
        `Error al eliminar cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para inactivar cliente (eliminación lógica) CON VERIFICACIÓN DE RELACIONES
  async inactivarCliente(
    inactivarDto: InactivarClienteDto,
    user: User
  ): Promise<ClienteResponseDto> {
    try {
      const { clienteId } = inactivarDto;

      // Verificar que el cliente existe
      const cliente = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }

      // Verificar si ya está inactivo
      if (!cliente.activo) {
        throw new BadRequestException(
          `El cliente con ID ${clienteId} ya está inactivo`,
        );
      }

      // Verificar si tiene relaciones
      const tieneRelaciones = await this.tieneRelaciones(clienteId);
      if (tieneRelaciones) {
        throw new ConflictException(
          'No se puede inactivar el cliente porque tiene registros relacionados con otras tablas.',
        );
      }

      // Actualizar a inactivo
      await this.clienteRepository.update(clienteId, {
        activo: false,
        fechaMod: new Date(),
        usuarioMod: user.email || 'admin',
      });

      // Obtener el cliente actualizado
      const clienteActualizado = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      return this.mapearClienteResponse(clienteActualizado);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new HttpException(
        `Error al inactivar cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para reactivar cliente
  async reactivarCliente(
    clienteId: number,
    user: User,
  ): Promise<ClienteResponseDto> {
    try {
      // Verificar que el cliente existe
      const cliente = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }

      // Verificar si ya está activo
      if (cliente.activo) {
        throw new BadRequestException(
          `El cliente con ID ${clienteId} ya está activo`,
        );
      }

      // Actualizar a activo
      await this.clienteRepository.update(clienteId, {
        activo: true,
        fechaMod: new Date(),
        usuarioMod: user.email || 'admin',
      });

      // Obtener el cliente actualizado
      const clienteActualizado = await this.clienteRepository.findOne({
        where: { clienteId },
      });

      return this.mapearClienteResponse(clienteActualizado);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new HttpException(
        `Error al reactivar cliente: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para verificar si el cliente tiene relaciones
  private async tieneRelaciones(clienteId: number): Promise<boolean> {
    try {
      // Obtener la conexión de TypeORM
      const connection = this.clienteRepository.manager.connection;

      // Lista de tablas que podrían tener relaciones con cliente
      const tablasRelacionadas = [
        'factura',
        'mascota',
        'presupuesto',
        // Añade aquí todas las tablas que tengan foreign key a cliente
      ];

      // Verificar cada tabla
      for (const tabla of tablasRelacionadas) {
        try {
          const query = `
                    SELECT EXISTS (
                        SELECT 1 
                        FROM ${tabla} 
                        WHERE cliente_id = $1
                        LIMIT 1
                    ) as tiene_relaciones
                `;

          const result = await connection.query(query, [clienteId]);

          if (result[0]?.tiene_relaciones === true) {
            return true; // Encontró una relación
          }
        } catch (tableError) {
          // Si la tabla no existe, continuar con la siguiente
          console.warn(
            `Tabla ${tabla} no encontrada o sin relación con cliente`,
          );
          continue;
        }
      }

      return false; // No encontró relaciones en ninguna tabla
    } catch (error) {
      console.error(
        `Error al verificar relaciones del cliente ${clienteId}:`,
        error,
      );
      return false; // En caso de error, permitir la operación
    }
  }
}
