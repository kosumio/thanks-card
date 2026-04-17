export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  nameKana: string;
  location: string;
  isAdmin: boolean;
}

export interface CategoryInfo {
  id: string;
  value: string;
  displayOrder: number;
  colorClass: string;
  bgClass: string;
  icon: string;
}

export interface ThanksCard {
  id: string;
  from: Employee;
  to: Employee;
  categories: CategoryInfo[];
  message: string;
  createdAt: string;
  reactionCount: number;
  reactedByMe: boolean;
  isPicked: boolean;
}

export const MAX_MESSAGE_LENGTH = 200;
