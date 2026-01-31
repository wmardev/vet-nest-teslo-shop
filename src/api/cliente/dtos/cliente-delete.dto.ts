import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class DeleteClienteDto {
  @IsInt()
  @Min(1, { message: 'El ID debe ser mayor a 0' })
  clienteId: number;
}

export class InactivarClienteDto {
  @IsInt()
  @Min(1, { message: 'El ID debe ser mayor a 0' })
  clienteId: number;
}