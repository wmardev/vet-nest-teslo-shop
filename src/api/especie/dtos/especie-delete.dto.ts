import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class DeleteEspecieDto {
    @IsInt()
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    especieId: number;

    @IsOptional()
    @IsString()
    usuarioMod?: string;
}

export class InactivarEspecieDto {
    @IsInt()
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    especieId: number;

    @IsOptional()
    @IsString()
    usuarioMod?: string;
}