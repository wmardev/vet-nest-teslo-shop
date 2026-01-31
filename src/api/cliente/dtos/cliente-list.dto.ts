import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min, IsIn, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginacionDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    pagina?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    limite?: number = 25;

    @IsOptional()
    @IsInt()
    @Min(0)
    offset?: number;
}

export class FiltrosClienteDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    cedula?: string;

    @IsOptional()
    @IsString()
    ruc?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    direccion?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimientoDesde?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimientoHasta?: string;
}

export class OrdenamientoDto {
    @IsOptional()
    @IsString()
    @IsIn(['nombre', 'cedula', 'ruc', 'telefono', 'fecha_creacion', 'fecha_nacimiento'])
    campo?: string = 'nombre';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    direccion?: string = 'asc';
}

export class ListClientesRequestDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => PaginacionDto)
    paginacion?: PaginacionDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => FiltrosClienteDto)
    filtros?: FiltrosClienteDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => OrdenamientoDto)
    ordenamiento?: OrdenamientoDto;
}