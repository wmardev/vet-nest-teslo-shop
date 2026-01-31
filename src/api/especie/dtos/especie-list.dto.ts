import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min, IsIn, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginacionEspecieDto {
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

export class FiltrosEspecieDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}

export class OrdenamientoEspecieDto {
    @IsOptional()
    @IsString()
    @IsIn(['nombre', 'fecha_creacion'])
    campo?: string = 'nombre';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    direccion?: string = 'asc';
}

export class ListEspeciesRequestDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => PaginacionEspecieDto)
    paginacion?: PaginacionEspecieDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => FiltrosEspecieDto)
    filtros?: FiltrosEspecieDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => OrdenamientoEspecieDto)
    ordenamiento?: OrdenamientoEspecieDto;
}