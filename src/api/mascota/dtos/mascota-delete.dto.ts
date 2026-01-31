import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class DeleteMascotaDto {
    @IsInt()
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    mascotaId: number;

    @IsOptional()
    @IsString()
    usuarioMod?: string;
}

export class InactivarMascotaDto {
    @IsInt()
    @Min(1, { message: 'El ID debe ser mayor a 0' })
    mascotaId: number;

    @IsOptional()
    @IsString()
    usuarioMod?: string;
}