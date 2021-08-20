import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CoreEntity } from '../../common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { IsEnum, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { UserRole, UserTeam } from './users.constants';
import { Reservation } from '../../reservation/entities/reservation.entity';

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(UserTeam, { name: 'UserTeam' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field((type) => String)
  @IsString()
  name: string;

  @Column({ unique: true })
  @Field((type) => String)
  @IsString()
  email: string;

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserTeam })
  @Field((type) => UserTeam)
  @IsEnum(UserTeam)
  team: UserTeam;

  @Column({ type: 'enum', enum: UserRole })
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field((type) => [Reservation], { nullable: true })
  @OneToMany((type) => Reservation, (reservation) => reservation.host, { nullable: true })
  reservations?: Reservation[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (err) {
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
