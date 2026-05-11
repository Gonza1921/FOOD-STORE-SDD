export interface Product {
  id: string
  name: string
  price: number
  stock: number
  categoryId: string
  createdAt: Date
}

export type NewProduct = Omit<Product, 'id' | 'createdAt'>
