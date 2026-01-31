import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class CreateEspecieDto {
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