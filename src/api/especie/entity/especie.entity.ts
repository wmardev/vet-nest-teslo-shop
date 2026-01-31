import { Mascota } from 'src/api/mascota/entity/mascota.entity';
import { Raza } from 'src/api/raza/entity/raza.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('especie')
export class Especie {
    @PrimaryGeneratedColumn({ name: 'especie_id' })
    especieId: number;

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
    @OneToMany(() => Raza, raza => raza.especie)
    razas: Raza[];

    @OneToMany(() => Mascota, mascota => mascota.especie)
    mascotas: Mascota[];
}