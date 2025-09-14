export interface UpdateMenuCommand {
  roleIds: number[];
  icon: string;
  isActive: boolean;
  name: string;
  order: number;
  parentId: number;
  route: string;
  title: string;
}