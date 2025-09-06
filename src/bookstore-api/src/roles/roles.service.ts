import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, In, } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleCommand } from './commands/create-role.command';
import { UpdateRoleCommand } from './commands/update-role.command';
import { Role } from './entities/role.entity';
import { RoleQuery } from './queries/role.query';


@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>
  ) { }

  async findOne(name: string): Promise<Role> {
    return this.roleRepository.findOne({ where: { name: name } });
  }

  async findById(id: number): Promise<Role> {
    return this.roleRepository.findOne({ where: { id: id } });
  }

  async findByNames(names: string[]): Promise<Role[]> {
    return this.roleRepository.find({ where: { name: In(names) } });
  }

  async findAll(query: RoleQuery): Promise<[Role[], number]> {
    let qb = this.roleRepository
      .createQueryBuilder('role');
    if (query.filter) {
      qb = qb.andWhere('role.name like :name', { name: query.filter + '%' });
    }

    if (query.startDate && query.endDate) {
      qb = qb.andWhere('role.createdTime >= :startDate', { startDate: query.startDate });
      qb = qb.andWhere('role.createdTime <= :endDate', { endDate: query.endDate });
    }

    return await qb
      .orderBy(query.sorting, query.order === 'asc' ? 'ASC' : 'DESC')
      .skip(query.skipCount)
      .take(query.maxResultCount)
      .getManyAndCount();
  }

  async insert(command: CreateRoleCommand): Promise<Role> {
    const roleToSave = new Role();
    roleToSave.name = command.name;
    return this.roleRepository.save(roleToSave);
  }

  async insertMany(commands: CreateRoleCommand[]): Promise<void> {
    const rolesToSave = commands.map((command) => {
      const roleToSave = new Role();
      roleToSave.name = command.name;
      return roleToSave;
    });
    await this.roleRepository.save(rolesToSave);
  }

  async update(id: number, command: UpdateRoleCommand): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id: id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    role.name = command.name ?? role.name;
    role.isActive = command.isActive ?? role.isActive;
    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.roleRepository.remove(role);
  }

  async count(): Promise<number> {
    return await this.roleRepository.count();
  }
}