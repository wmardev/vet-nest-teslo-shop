import { Especie } from 'src/api/especie/entity/especie.entity';
import { Mascota } from 'src/api/mascota/entity/mascota.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';

@Entity('raza')
export class Raza {
    @PrimaryGeneratedColumn({ name: 'raza_id' })
    razaId: number;

    @Column({ name: 'especie_id' })
    especieId: number;

    @ManyToOne(() => Especie, especie => especie.razas)
    @JoinColumn({ name: 'especie_id' })
    especie: Especie;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion?: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true, name: 'usuario_creacion' })
    usuarioCreacion?: string;

    @CreateDateColumn({ name: 'fecha_creacion' })
    fechaCreacion: Date;

    @Column({ type: 'varchar', length: 100, nullable: true, name: 'usuario_mod' })
    usuarioMod?: string;

    @UpdateDateColumn({ name: 'fecha_mod' })
    fechaMod: Date;

    // Relaciones
    @OneToMany(() => Mascota, mascota => mascota.raza)
    mascotas: Mascota[];
}