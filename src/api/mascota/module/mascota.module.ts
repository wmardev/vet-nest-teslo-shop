import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from 'src/api/cliente/entity/cliente.entity';
import { ClienteModule } from 'src/api/cliente/module/cliente.module';
import { Especie } from 'src/api/especie/entity/especie.entity';
import { EspecieModule } from 'src/api/especie/module/especie.module';
import { Raza } from 'src/api/raza/entity/raza.entity';
import { RazaModule } from 'src/api/raza/module/raza.module';
import { AuthModule } from 'src/auth/auth.module';
import { Mascota } from '../entity/mascota.entity';
import { MascotasController } from '../mascota.controller';
import { MascotaService } from '../mascota.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Mascota, Cliente, Especie, Raza]),
        AuthModule,
        ClienteModule,
        EspecieModule,
        RazaModule
    ],
    controllers: [MascotasController],
    providers: [MascotaService],
    exports: [MascotaService]
})
export class MascotaModule { }