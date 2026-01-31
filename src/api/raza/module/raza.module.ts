import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Especie } from 'src/api/especie/entity/especie.entity';
import { EspecieModule } from 'src/api/especie/module/especie.module';
import { AuthModule } from 'src/auth/auth.module';
import { Raza } from '../entity/raza.entity';
import { RazaService } from '../raza.service';
import { RazasController } from '../reza.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Raza, Especie]),
        AuthModule,
        EspecieModule
    ],
    controllers: [RazasController],
    providers: [RazaService],
    exports: [RazaService]
})
export class RazaModule { }