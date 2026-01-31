import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsDateString, IsInt, Min, Length, Matches } from 'class-validator';

export class CreateClienteDto {
    @IsString()
    @Length(3, 200, { message: 'El nombre debe tener entre 3 y 200 caracteres' })
    nombre: string;

    @IsOptional()
    @IsString()
    @Length(6, 20, { message: 'La cédula debe tener entre 6 y 20 caracteres' })
    @Matches(/^[0-9]*$/, { message: 'La cédula solo puede contener números' })
    cedula?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value === '' ? undefined : value)
    @Length(0, 20, { message: 'El RUC debe tener entre 8 y 20 caracteres' })
    ruc?: string;

    @IsOptional()
    @IsString()
    @Length(7, 20, { message: 'El teléfono debe tener entre 7 y 20 caracteres' })
    telefono?: string;

    @IsOptional()
    @IsString()
    direccion?: string;

    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : value)
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha de nacimiento debe estar en formato YYYY-MM-DD'
    })
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    ubicacionGps?: string;
}