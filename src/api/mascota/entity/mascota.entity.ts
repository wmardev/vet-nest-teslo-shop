import { Cliente } from 'src/api/cliente/entity/cliente.entity';
import { Especie } from 'src/api/especie/entity/especie.entity';
import { Raza } from 'src/api/raza/entity/raza.entity';
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

@Entity('mascota')
export class Mascota {
    @PrimaryGeneratedColumn({ name: 'mascota_id' })
    mascotaId: number;

    @Column({ name: 'cliente_id' })
    clienteId: number;

    @ManyToOne(() => Cliente, cliente => cliente.mascotas)
    @JoinColumn({ name: 'cliente_id' })
    cliente: Cliente;

    @Column({ name: 'especie_id' })
    especieId: number;

    @ManyToOne(() => Especie, especie => especie.mascotas)
    @JoinColumn({ name: 'especie_id' })
    especie: Especie;

    @Column({ name: 'raza_id' })
    razaId: number;

    @ManyToOne(() => Raza, raza => raza.mascotas)
    @JoinColumn({ name: 'raza_id' })
    raza: Raza;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'date', nullable: true, name: 'fecha_nacimiento' })
    fechaNacimiento?: Date;

    @Column({ type: 'char', length: 1, nullable: true })
    sexo?: string;

    @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
    chip?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    pelaje?: string;

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
}