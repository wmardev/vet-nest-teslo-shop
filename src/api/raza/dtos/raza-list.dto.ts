import { IsOptional, IsString, IsBoolean, IsInt, Min, IsIn, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginacionRazaDto {
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

export class FiltrosRazaDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    especieId?: number;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}

export class OrdenamientoRazaDto {
    @IsOptional()
    @IsString()
    @IsIn(['nombre', 'fecha_creacion', 'especie'])
    campo?: string = 'nombre';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    direccion?: string = 'asc';
}

export class ListRazasRequestDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => PaginacionRazaDto)
    paginacion?: PaginacionRazaDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => FiltrosRazaDto)
    filtros?: FiltrosRazaDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => OrdenamientoRazaDto)
    ordenamiento?: OrdenamientoRazaDto;
}