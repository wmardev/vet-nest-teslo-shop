import { IsString, IsInt, IsOptional, IsBoolean, Length, Min, IsDateString, IsIn } from 'class-validator';

export class CreateMascotaDto {
    @IsInt()
    @Min(1, { message: 'El ID de cliente debe ser mayor a 0' })
    clienteId: number;

    @IsInt()
    @Min(1, { message: 'El ID de especie debe ser mayor a 0' })
    especieId: number;

    @IsInt()
    @Min(1, { message: 'El ID de raza debe ser mayor a 0' })
    razaId: number;

    @IsString()
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    nombre: string;

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    @IsIn(['M', 'H', 'F'], { message: 'El sexo debe ser M (macho), H (hembra) o F (sin especificar)' })
    sexo?: string = 'F';

    @IsOptional()
    @IsString()
    @Length(10, 50, { message: 'El chip debe tener entre 10 y 50 caracteres' })
    chip?: string;

    @IsOptional()
    @IsString()
    @Length(2, 100, { message: 'El pelaje debe tener entre 2 y 100 caracteres' })
    pelaje?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean = true;

    @IsOptional()
    @IsString()
    usuarioCreacion?: string;
}