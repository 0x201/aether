import { Injectable } from '@nestjs/common';
import { Repository, In, } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleCommand } from './commands/create-role.command';
import { Role } from './entities/role.entity';


@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>
  ) { }

  async findOne(name: string): Promise<Role> {
    return this.roleRepository.findOne({ where: { name: name } });
  }

  async findByNames(names: string[]): Promise<Role[]> {
    return this.roleRepository.find({ where: { name: In(names) } });
  }

  async insert(command: CreateRoleCommand): Promise<void> {
    const roleToSave = new Role();
    roleToSave.name = command.name;
    await this.roleRepository.save(roleToSave);
  }

  async insertMany(commands: CreateRoleCommand[]): Promise<void>  {
    const rolesToSave = commands.map((command) => {
      const roleToSave = new Role();
      roleToSave.name = command.name;
      return roleToSave;
    });
    await this.roleRepository.save(rolesToSave);
  }

  async count(): Promise<number> {
    return await this.roleRepository.count();
  }
}
