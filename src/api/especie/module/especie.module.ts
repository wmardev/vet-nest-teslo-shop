import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Especie } from '../entity/especie.entity';
import { EspeciesController } from '../especie.controller';
import { EspecieService } from '../especie.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Especie]),
        AuthModule
    ],
    controllers: [EspeciesController],
    providers: [EspecieService],
    exports: [EspecieService]
})
export class EspecieModule { }