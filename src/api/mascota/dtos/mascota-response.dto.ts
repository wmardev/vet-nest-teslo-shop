export class MascotaResponseDto {
    mascotaId: number;
    nombre: string;
    fechaNacimiento?: Date;
    sexo?: string;
    chip?: string;
    pelaje?: string;
    descripcion?: string;
    activo: boolean;
    fechaCreacion: Date;
    cliente: {
        clienteId: number;
        nombre: string;
    };
    especie: {
        especieId: number;
        nombre: string;
    };
    raza: {
        razaId: number;
        nombre: string;
    };
}

export class MascotaSimpleResponseDto {
    mascotaId: number;
    nombre: string;
    fechaNacimiento?: Date;
    sexo?: string;
    chip?: string;
    activo: boolean;
    fechaCreacion: Date;
}

export class ListMascotasResponseDto {
    data: MascotaResponseDto[];
    paginacion: {
        pagina: number;
        limite: number;
        total: number;
        totalPaginas: number;
    };
}

export class ApiResponseDto<T> {
    ok: boolean;
    mensaje: string;
    resultado: T;
}

// Tipo específico para la respuesta de listado
export type ListMascotasApiResponse = ApiResponseDto<ListMascotasResponseDto>;