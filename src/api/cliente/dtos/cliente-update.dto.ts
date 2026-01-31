import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './cliente-create.dto';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
}