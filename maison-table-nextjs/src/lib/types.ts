export type Dietary = "vegetarian" | "vegan" | "gluten-free" | "spicy" | "dairy-free";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort: number;
}

export interface MenuItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  dietary: Dietary[];
  available: boolean;
  featured: boolean;
  bestSeller?: boolean | undefined;
  chefPick?: boolean | undefined;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "online";

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  note?: string | undefined;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  customer: { name: string; phone: string; address: string; email?: string };
  notes?: string | undefined;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string | undefined;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  history: OrderEvent[];
  simulated?: boolean | undefined;
  collectedAt?: string | undefined;
}

export interface CartLine {
  itemId: string;
  qty: number;
  note?: string | undefined;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  type: "percent" | "free_delivery" | "fixed";
  value: number;
  active: boolean;
  minSubtotal?: number | undefined;
}

export interface Staff {
  id: string;
  name: string;
  role: "Owner" | "Manager" | "Chef" | "Cashier" | "Rider";
  email: string;
  active: boolean;
}

export interface Hours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Settings {
  name: string;
  phone: string;
  email: string;
  address: string;
  about: string;
  deliveryFee: number;
  freeDeliveryOver: number;
  minOrder: number;
  deliveryRadiusKm: number;
  etaMinutes: number;
  acceptingOrders: boolean;
  hours: Hours[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  simulated?: boolean | undefined;
  orderId?: string | undefined;
}

export interface DB {
  categories: Category[];
  menu: MenuItem[];
  orders: Order[];
  promotions: Promotion[];
  staff: Staff[];
  settings: Settings;
  notifications: AppNotification[];
}
