export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  nameKana: string;
  location: string;
  isAdmin: boolean;
}

export interface ThanksCard {
  id: string;
  from: Employee;
  to: Employee;
  message: string;
  createdAt: string;
  reactionCount: number;
  reactedByMe: boolean;
  isPicked: boolean;
}

export const MAX_MESSAGE_LENGTH = 200;
