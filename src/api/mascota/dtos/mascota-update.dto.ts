import { PartialType } from '@nestjs/mapped-types';
import { CreateMascotaDto } from './mascota-create.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMascotaDto extends PartialType(CreateMascotaDto) {
    @IsOptional()
    @IsString()
    usuarioMod?: string;
}