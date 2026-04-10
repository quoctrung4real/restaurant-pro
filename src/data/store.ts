import { v4 as uuidv4 } from 'uuid';
import type {
  MenuItem, Category, Ingredient, Table, Order, Employee,
  Customer, FixedCost, Revenue, Attendance, Supplier
} from '../types';

// =============================================
// SEED DATA — 12 THÁNG DỮ LIỆU MẪU
// =============================================

export const seedCategories: Category[] = [
  { id: 'cat-1', name: 'Cà phê', emoji: '☕', color: '#c2570c' },
  { id: 'cat-2', name: 'Trà & Nước ngọt', emoji: '🍵', color: '#0891b2' },
  { id: 'cat-3', name: 'Đồ ăn sáng', emoji: '🥐', color: '#d97706' },
  { id: 'cat-4', name: 'Đồ ăn chính', emoji: '🍜', color: '#dc2626' },
  { id: 'cat-5', name: 'Tráng miệng', emoji: '🍰', color: '#7c3aed' },
  { id: 'cat-6', name: 'Sinh tố & Nước ép', emoji: '🥤', color: '#059669' },
];

export const seedIngredients: Ingredient[] = [
  { id: 'ing-1', name: 'Cà phê rang xay', unit: 'gram', stock: 2000, minStock: 500, costPerUnit: 0.35 },
  { id: 'ing-2', name: 'Sữa tươi', unit: 'ml', stock: 5000, minStock: 1000, costPerUnit: 0.025 },
  { id: 'ing-3', name: 'Đường', unit: 'gram', stock: 3000, minStock: 500, costPerUnit: 0.015 },
  { id: 'ing-4', name: 'Trà xanh matcha', unit: 'gram', stock: 800, minStock: 200, costPerUnit: 0.8 },
  { id: 'ing-5', name: 'Bánh mì', unit: 'cái', stock: 50, minStock: 10, costPerUnit: 5000 },
  { id: 'ing-6', name: 'Trứng gà', unit: 'quả', stock: 100, minStock: 20, costPerUnit: 3500 },
  { id: 'ing-7', name: 'Thịt heo', unit: 'gram', stock: 3000, minStock: 500, costPerUnit: 0.22 },
  { id: 'ing-8', name: 'Mỳ tươi', unit: 'gram', stock: 4000, minStock: 800, costPerUnit: 0.05 },
  { id: 'ing-9', name: 'Xoài', unit: 'gram', stock: 2000, minStock: 500, costPerUnit: 0.04 },
  { id: 'ing-10', name: 'Dâu tây', unit: 'gram', stock: 1000, minStock: 300, costPerUnit: 0.12 },
  { id: 'ing-11', name: 'Kem tươi (whipping cream)', unit: 'ml', stock: 2000, minStock: 400, costPerUnit: 0.065 },
  { id: 'ing-12', name: 'Nước cốt dừa', unit: 'ml', stock: 3000, minStock: 600, costPerUnit: 0.03 },
];

export const seedMenuItems: MenuItem[] = [
  // Cà phê
  { id: 'mi-1', name: 'Cà phê đen', categoryId: 'cat-1', price: 25000, cost: 6000, emoji: '☕', available: true, unit: 'ly' },
  { id: 'mi-2', name: 'Cà phê sữa', categoryId: 'cat-1', price: 30000, cost: 9000, emoji: '🥛', available: true, unit: 'ly' },
  { id: 'mi-3', name: 'Cappuccino', categoryId: 'cat-1', price: 45000, cost: 14000, emoji: '☕', available: true, unit: 'ly' },
  { id: 'mi-4', name: 'Latte', categoryId: 'cat-1', price: 48000, cost: 15000, emoji: '☕', available: true, unit: 'ly' },
  { id: 'mi-5', name: 'Cold Brew', categoryId: 'cat-1', price: 55000, cost: 16000, emoji: '🧊', available: true, unit: 'ly' },
  { id: 'mi-6', name: 'Americano', categoryId: 'cat-1', price: 40000, cost: 12000, emoji: '☕', available: true, unit: 'ly' },

  // Trà & Nước
  { id: 'mi-7', name: 'Trà đào', categoryId: 'cat-2', price: 35000, cost: 10000, emoji: '🍑', available: true, unit: 'ly' },
  { id: 'mi-8', name: 'Trà matcha', categoryId: 'cat-2', price: 42000, cost: 14000, emoji: '🍵', available: true, unit: 'ly' },
  { id: 'mi-9', name: 'Trà tắc', categoryId: 'cat-2', price: 28000, cost: 7000, emoji: '🍋', available: true, unit: 'ly' },
  { id: 'mi-10', name: 'Nước chanh', categoryId: 'cat-2', price: 25000, cost: 6000, emoji: '🍋', available: true, unit: 'ly' },

  // Đồ ăn sáng
  { id: 'mi-11', name: 'Bánh mì trứng', categoryId: 'cat-3', price: 20000, cost: 8000, emoji: '🥚', available: true, unit: 'cái' },
  { id: 'mi-12', name: 'Bánh mì thịt nguội', categoryId: 'cat-3', price: 25000, cost: 10000, emoji: '🥖', available: true, unit: 'cái' },
  { id: 'mi-13', name: 'Xôi mặn', categoryId: 'cat-3', price: 20000, cost: 7000, emoji: '🍱', available: true, unit: 'hộp' },

  // Đồ ăn chính
  { id: 'mi-14', name: 'Phở bò', categoryId: 'cat-4', price: 65000, cost: 28000, emoji: '🍜', available: true, unit: 'tô' },
  { id: 'mi-15', name: 'Bún bò Huế', categoryId: 'cat-4', price: 60000, cost: 25000, emoji: '🍲', available: true, unit: 'tô' },
  { id: 'mi-16', name: 'Cơm sườn', categoryId: 'cat-4', price: 55000, cost: 22000, emoji: '🍖', available: true, unit: 'phần' },
  { id: 'mi-17', name: 'Mì xào bò', categoryId: 'cat-4', price: 58000, cost: 24000, emoji: '🍝', available: true, unit: 'phần' },

  // Tráng miệng
  { id: 'mi-18', name: 'Chè đậu đỏ', categoryId: 'cat-5', price: 22000, cost: 7000, emoji: '🍮', available: true, unit: 'ly' },
  { id: 'mi-19', name: 'Kem dừa', categoryId: 'cat-5', price: 30000, cost: 9000, emoji: '🍦', available: true, unit: 'ly' },
  { id: 'mi-20', name: 'Bánh flan', categoryId: 'cat-5', price: 18000, cost: 5000, emoji: '🍮', available: true, unit: 'cái' },

  // Sinh tố
  { id: 'mi-21', name: 'Sinh tố xoài', categoryId: 'cat-6', price: 38000, cost: 12000, emoji: '🥭', available: true, unit: 'ly' },
  { id: 'mi-22', name: 'Sinh tố dâu', categoryId: 'cat-6', price: 40000, cost: 14000, emoji: '🍓', available: true, unit: 'ly' },
  { id: 'mi-23', name: 'Nước ép cam', categoryId: 'cat-6', price: 35000, cost: 10000, emoji: '🍊', available: true, unit: 'ly' },
];

export const seedTables: Table[] = Array.from({ length: 16 }, (_, i) => ({
  id: `table-${i + 1}`,
  number: i + 1,
  capacity: i < 12 ? 4 : 8,
  status: 'empty' as const,
  zone: i < 8 ? 'Khu A' : 'Khu B',
}));

export const seedEmployees: Employee[] = [
  { id: 'emp-1', name: 'Nguyễn Văn An', role: 'manager', phone: '0901234567', hourlyWage: 60000, startDate: '2023-01-15', status: 'active' },
  { id: 'emp-2', name: 'Trần Thị Bình', role: 'chef', phone: '0912345678', hourlyWage: 50000, startDate: '2023-03-01', status: 'active' },
  { id: 'emp-3', name: 'Lê Văn Cường', role: 'waiter', phone: '0923456789', hourlyWage: 35000, startDate: '2023-06-01', status: 'active' },
  { id: 'emp-4', name: 'Phạm Thị Dung', role: 'waiter', phone: '0934567890', hourlyWage: 35000, startDate: '2024-01-10', status: 'active' },
  { id: 'emp-5', name: 'Hoàng Văn Em', role: 'cashier', phone: '0945678901', hourlyWage: 38000, startDate: '2023-09-15', status: 'active' },
  { id: 'emp-6', name: 'Vũ Thị Phương', role: 'chef', phone: '0956789012', hourlyWage: 48000, startDate: '2024-03-01', status: 'active' },
];

export const seedFixedCosts: FixedCost[] = [
  { id: 'fc-1', name: 'Thuê mặt bằng', amount: 15000000, frequency: 'monthly', category: 'rent' },
  { id: 'fc-2', name: 'Điện', amount: 3500000, frequency: 'monthly', category: 'utilities' },
  { id: 'fc-3', name: 'Nước', amount: 800000, frequency: 'monthly', category: 'utilities' },
  { id: 'fc-4', name: 'Internet + WiFi', amount: 500000, frequency: 'monthly', category: 'utilities' },
  { id: 'fc-5', name: 'Bảo hiểm cửa hàng', amount: 2400000, frequency: 'yearly', category: 'insurance' },
  { id: 'fc-6', name: 'Marketing & Quảng cáo', amount: 1500000, frequency: 'monthly', category: 'marketing' },
  { id: 'fc-7', name: 'Khấu hao thiết bị', amount: 2000000, frequency: 'monthly', category: 'equipment' },
];

export const seedCustomers: Customer[] = [
  { id: 'cust-1', name: 'Nguyễn Minh Anh', phone: '0901111111', points: 1250, totalSpent: 2500000, visitCount: 45, joinDate: '2023-03-15', segment: 'vip', lastVisit: '2024-11-10' },
  { id: 'cust-2', name: 'Trần Quốc Bảo', phone: '0912222222', points: 680, totalSpent: 1360000, visitCount: 22, joinDate: '2023-07-20', segment: 'regular', lastVisit: '2024-11-05' },
  { id: 'cust-3', name: 'Lê Thu Cúc', phone: '0923333333', points: 320, totalSpent: 640000, visitCount: 8, joinDate: '2024-08-10', segment: 'new', lastVisit: '2024-10-28' },
  { id: 'cust-4', name: 'Phạm Hữu Dũng', phone: '0934444444', points: 2100, totalSpent: 4200000, visitCount: 78, joinDate: '2022-12-01', segment: 'vip', lastVisit: '2024-11-09' },
  { id: 'cust-5', name: 'Hoàng Thị Mai', phone: '0945555555', points: 50, totalSpent: 100000, visitCount: 2, joinDate: '2024-10-15', segment: 'new', lastVisit: '2024-10-20' },
];

// =============================================
// GENERATE 12 MONTHS OF REVENUE DATA
// =============================================

export function generateRevenueData(): Revenue[] {
  const data: Revenue[] = [];
  // Generate 365 days ending today
  const endDate = new Date();
  const baseDate = new Date(endDate);
  baseDate.setDate(baseDate.getDate() - 365);

  // Seasonal patterns (multiplier per month: Jan-Dec)
  const seasonality = [0.75, 0.72, 0.85, 0.90, 0.88, 0.85, 0.80, 0.78, 0.92, 1.0, 1.1, 1.25];
  // Day of week patterns (Mon=0 to Sun=6)
  const dowPattern = [0.75, 0.80, 0.85, 0.90, 1.05, 1.25, 1.35];
  // Base daily revenue
  const baseDailyRevenue = 4_200_000;

  for (let day = 0; day < 365; day++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + day);

    const month = d.getMonth();
    const dow = d.getDay();

    // Growth trend: 0.8% per month
    const growthFactor = 1 + (day / 365) * 0.10;

    // Add noise
    const noise = 0.85 + Math.random() * 0.30;

    const amount = Math.round(
      baseDailyRevenue * seasonality[month] * dowPattern[dow] * growthFactor * noise
    );

    const avgOrderValue = 85000 + Math.random() * 40000;
    const orderCount = Math.round(amount / avgOrderValue);

    data.push({
      date: d.toISOString().split('T')[0],
      amount,
      orderCount,
      avgOrderValue: Math.round(avgOrderValue),
    });
  }

  return data;
}

// =============================================
// LOCAL STORAGE PERSISTENCE
// =============================================

const STORAGE_KEY = 'restaurantpro_data_v2';

export type AppData = {
  categories: Category[];
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  tables: Table[];
  orders: Order[];
  employees: Employee[];
  customers: Customer[];
  fixedCosts: FixedCost[];
  revenues: Revenue[];
  attendances: Attendance[];
  suppliers: Supplier[];
  businessName: string;
  businessType: string;
};

export function loadData(): AppData {
  try {
    // Clear old version keys
    ['restaurantpro_data_v1'].forEach(k => localStorage.removeItem(k));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }

  // Return seed data
  return {
    categories: seedCategories,
    menuItems: seedMenuItems,
    ingredients: seedIngredients,
    tables: seedTables,
    orders: generateSampleOrders(),
    employees: seedEmployees,
    customers: seedCustomers,
    fixedCosts: seedFixedCosts,
    revenues: generateRevenueData(),
    attendances: [],
    suppliers: [],
    businessName: 'Quán Cà Phê Hương Việt',
    businessType: 'Quán Cà Phê & Ẩm Thực',
  };
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function generateSampleOrders(): Order[] {
  const orders: Order[] = [];
  const items = seedMenuItems;
  const today = new Date();

  for (let i = 0; i < 50; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(Math.random() * 30));

    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems: import('../types').OrderItem[] = [];

    for (let j = 0; j < numItems; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      orderItems.push({
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        cost: item.cost,
        quantity: qty,
      });
    }

    const subtotal = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    orders.push({
      id: uuidv4(),
      tableNumber: Math.floor(Math.random() * 16) + 1,
      items: orderItems,
      subtotal,
      discount: 0,
      tax,
      total,
      status: 'paid',
      paymentMethod: Math.random() > 0.5 ? 'cash' : 'transfer',
      createdAt: d.toISOString(),
      paidAt: d.toISOString(),
    });
  }

  return orders;
}
