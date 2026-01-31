import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Cliente } from '../entity/cliente.entity';
import { ClientesController } from '../cliente.controller';
import { ClienteService } from '../cliente.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cliente]),
        AuthModule
    ],
    controllers: [ClientesController],
    providers: [ClienteService],
})
export class ClienteModule { }