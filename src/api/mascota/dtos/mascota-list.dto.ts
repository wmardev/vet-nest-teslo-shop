import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min, IsIn, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginacionMascotaDto {
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

export class FiltrosMascotaDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    clienteId?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    especieId?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    razaId?: number;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['M', 'H', 'F'])
    sexo?: string;

    @IsOptional()
    @IsString()
    chip?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimientoDesde?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimientoHasta?: string;
}

export class OrdenamientoMascotaDto {
    @IsOptional()
    @IsString()
    @IsIn(['nombre', 'fecha_creacion', 'fecha_nacimiento', 'cliente', 'especie', 'raza'])
    campo?: string = 'nombre';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    direccion?: string = 'asc';
}

export class ListMascotasRequestDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => PaginacionMascotaDto)
    paginacion?: PaginacionMascotaDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => FiltrosMascotaDto)
    filtros?: FiltrosMascotaDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => OrdenamientoMascotaDto)
    ordenamiento?: OrdenamientoMascotaDto;
}