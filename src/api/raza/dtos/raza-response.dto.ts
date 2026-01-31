export class RazaResponseDto {
    razaId: number;
    especieId: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    fechaCreacion: Date;
    especieNombre?: string; // Para mostrar en listados
}

export class RazaDetalleResponseDto {
    razaId: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    fechaCreacion: Date;
    especie: {
        especieId: number;
        nombre: string;
        activo: boolean;
    };
}

export class ListRazasResponseDto {
    data: RazaResponseDto[];
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
export type ListRazasApiResponse = ApiResponseDto<ListRazasResponseDto>;