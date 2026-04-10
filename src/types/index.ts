// =============================================
// RESTAURANTPRO — CORE TYPES
// =============================================

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  categoryId: string;
  price: number;             // Giá bán
  cost: number;              // Chi phí nguyên liệu
  description?: string;
  emoji: string;
  available: boolean;
  unit: string;
  ingredients?: RecipeItem[];
};

export type RecipeItem = {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  supplierId?: string;
  lastRestocked?: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type Table = {
  id: string;
  number: number;
  capacity: number;
  status: 'empty' | 'occupied' | 'ready';
  currentOrderId?: string;
  zone?: string;
};

export type OrderItem = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  cost: number;
  quantity: number;
  note?: string;
};

export type Order = {
  id: string;
  tableId?: string;
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'open' | 'paid' | 'cancelled';
  paymentMethod?: 'cash' | 'transfer' | 'card';
  createdAt: string;
  paidAt?: string;
  customerId?: string;
  note?: string;
};

export type Employee = {
  id: string;
  name: string;
  role: 'manager' | 'chef' | 'waiter' | 'cashier' | 'other';
  phone?: string;
  hourlyWage: number;
  startDate: string;
  status: 'active' | 'inactive';
};

export type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
};

export type FixedCost = {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  category: 'rent' | 'utilities' | 'insurance' | 'equipment' | 'marketing' | 'other';
};

export type Revenue = {
  date: string;          // YYYY-MM-DD
  amount: number;
  orderCount: number;
  avgOrderValue: number;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  points: number;
  totalSpent: number;
  visitCount: number;
  joinDate: string;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  favoriteItems?: string[];
  lastVisit?: string;
};

// =============================================
// FORECAST TYPES
// =============================================

export type ForecastResult = {
  date: string;
  predicted: number;
  lower: number;       // Confidence interval lower
  upper: number;       // Confidence interval upper
  model: string;
};

export type ForecastReport = {
  dailyForecasts: ForecastResult[];
  monthlyTotal: number;
  growthRate: number;
  confidence: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  peakDays: string[];
  lowDays: string[];
};

// =============================================
// ACCOUNTING TYPES
// =============================================

export type PnLReport = {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  staffCost: number;
  fixedCosts: number;
  otherCosts: number;
  totalOpex: number;
  ebitda: number;
  netProfit: number;
  netMargin: number;
};

export type BreakEvenAnalysis = {
  fixedCosts: number;
  variableCostRatio: number;      // % of revenue
  contributionMargin: number;     // 1 - variable cost ratio
  breakEvenRevenue: number;
  breakEvenOrders: number;
  avgOrderValue: number;
  safetyMargin: number;
  currentRevenue: number;
};

// =============================================
// MENU ENGINEERING TYPES
// =============================================

export type MenuEngineeringItem = {
  menuItemId: string;
  name: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
  avgCost: number;
  contributionMargin: number;
  popularityScore: number;
  profitabilityScore: number;
  classification: 'star' | 'plow_horse' | 'puzzle' | 'dog';
  recommendation: string;
};

export type PricingRecommendation = {
  menuItemId?: string;
  name: string;
  ingredientCost: number;
  labourCost: number;
  overheadCost: number;
  totalCost: number;
  targetFoodCostPercent: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  currentPrice?: number;
  profitMargin: number;
};

export type AppView =
  | 'dashboard'
  | 'pos'
  | 'menu'
  | 'inventory'
  | 'staff'
  | 'finance'
  | 'forecast'
  | 'pricing'
  | 'engineering'
  | 'customers'
  | 'reports'
  | 'settings';
