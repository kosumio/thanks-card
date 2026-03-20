export type Category =
  | "志高く、挑戦・進化"
  | "5S"
  | "報連相"
  | "思いやり"
  | "約束・ルールを守る";

export type Location =
  | "本社"
  | "HD"
  | "アバロン工場"
  | "横浜"
  | "エンイート"
  | "UMITTO";

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  nameKana: string;
  location: Location;
  isAdmin: boolean;
}

export interface ThanksCard {
  id: string;
  fromId: string;
  toId: string;
  categories: Category[];
  message: string;
  createdAt: string;
  reactions: number;
  reactedBy: string[];
  isPicked: boolean;
}

export const MAX_MESSAGE_LENGTH = 200;
