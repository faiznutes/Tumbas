export type ProductStatus = "AVAILABLE" | "SOLD";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  category: string;
  images: string[];
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Order {
  id: string;
  productId: string;
  userId: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  amount: number;
  snapToken?: string;
  createdAt: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}
