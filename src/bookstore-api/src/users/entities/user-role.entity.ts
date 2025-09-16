import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Role } from "../../roles/entities/role.entity";

@Entity('UserRole')
@Index('IDX_UserRole_UserId_RoleId', ['userId', 'roleId'], { unique: true })
export class UserRole {
    @PrimaryGeneratedColumn({ name: "Id" })
    id: number;

    @Column({ name: "UserId" })
    userId: number;

    @Column({ name: "RoleId" })
    roleId: number;

    @Column({ name: "AssignedAt", type: 'datetime', default: () => 'GETDATE()' })
    assignedAt: string;

    @Column({ name: "AssignedBy", nullable: true })
    assignedBy: string;

    @ManyToOne(() => User, (user) => user.userRoles, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: "UserId" })
    user: User;

    @ManyToOne(() => Role, (role) => role.userRoles, {
        createForeignKeyConstraints: false
    })
    @JoinColumn({ name: "RoleId" })
    role: Role;
}