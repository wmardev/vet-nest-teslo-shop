export class EspecieResponseDto {
    especieId: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    fechaCreacion: Date;
}

export class ListEspeciesResponseDto {
    data: EspecieResponseDto[];
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
export type ListEspeciesApiResponse = ApiResponseDto<ListEspeciesResponseDto>;