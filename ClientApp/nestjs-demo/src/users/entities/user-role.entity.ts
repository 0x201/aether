import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { Role } from "src/roles/entities/role.entity";

@Entity('user_role')
@Index('IDX_USER_ROLE_USER_ID', ['userId'])
@Index('IDX_USER_ROLE_ROLE_ID', ['roleId'])
export class UserRole {
    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @PrimaryColumn({ name: 'role_id' })
    roleId: number;

    @ManyToOne(() => User, (user) => user.userRoles)
    @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_USER_ROLE_USER_ID' })
    user: User;

    @ManyToOne(() => Role, (role) => role.userRoles)
    @JoinColumn({ name: 'role_id', foreignKeyConstraintName: 'FK_USER_ROLE_ROLE_ID' })
    role: Role;
}