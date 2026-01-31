import { Transform } from "class-transformer";

export class ClienteResponseDto {
    clienteId: number;
    nombre: string;
    cedula?: string;
    ruc?: string;
    telefono?: string;
    direccion?: string;
    fechaNacimiento?: String
    activo: boolean;
    fechaCreacion: Date;
    usuarioCreacion: string;
    fechaMod: Date;
    usuarioMod: string
}

export class ListClientesResponseDto {
    data: ClienteResponseDto[];
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
export type ListClientesApiResponse = ApiResponseDto<ListClientesResponseDto>;