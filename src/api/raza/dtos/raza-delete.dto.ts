import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class DeleteRazaDto {
    @IsInt()
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    razaId: number;

    @IsOptional()
    @IsString()
    usuarioMod?: string;
}

export class InactivarRazaDto {
    @IsInt()
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    razaId: number;

    @IsOptional()
    @IsString()
    usuarioMod?: string;
}