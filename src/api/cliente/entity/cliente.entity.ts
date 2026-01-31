import { Mascota } from 'src/api/mascota/entity/mascota.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('cliente')
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'cliente_id' })
  clienteId: number;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  cedula?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  ruc?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ type: 'date', nullable: true, name: 'fecha_nacimiento' })
  fechaNacimiento?: String;

  @Column({ type: 'point', nullable: true, name: 'ubicacion_gps' })
  ubicacionGps?: string;

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

  @OneToMany(() => Mascota, mascota => mascota.cliente)
  mascotas: Mascota[];
}