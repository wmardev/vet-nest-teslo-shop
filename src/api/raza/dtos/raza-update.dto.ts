import { PartialType } from '@nestjs/mapped-types';
import { CreateRazaDto } from './raza-create.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRazaDto extends PartialType(CreateRazaDto) {
    @IsOptional()
    @IsString()
    usuarioMod?: string;
}