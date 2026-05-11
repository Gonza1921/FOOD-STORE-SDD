export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'stock' | 'orders' | 'customer';
  createdAt: Date;
}

export type NewUser = Omit<User, 'id' | 'createdAt'>;
