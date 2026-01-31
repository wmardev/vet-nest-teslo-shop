import { PartialType } from '@nestjs/mapped-types';
import { CreateEspecieDto } from './especie-create.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEspecieDto extends PartialType(CreateEspecieDto) {
    @IsOptional()
    @IsString()
    usuarioMod?: string;
}