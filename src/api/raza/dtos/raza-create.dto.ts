import { IsString, IsInt, IsOptional, IsBoolean, Length, Min } from 'class-validator';

export class CreateRazaDto {
    @IsInt()
    @Min(1, { message: 'El ID de especie debe ser mayor a 0' })
    especieId: number;

    @IsString()
    @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
    nombre: string;

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