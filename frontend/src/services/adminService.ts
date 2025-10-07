import { AxiosInstance } from 'axios';

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  todayOrders: number;
  activeUsers: number;
  newUsersThisWeek: number;
  adminUsers?: number;
  verifiedUsers?: number;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'customer' | 'supplier' | 'manager' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_orders?: number;
  total_spent?: number;
}

export interface AdminOrder {
  id: number;
  user_id: number;
  product_id?: string;
  price: number;
  currency: string;
  status: string;
  payment_status: string;
  g2a_order_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  product_name?: string;
  total_price?: number;
  order_items?: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: number;
  order_id: number;
  product_id: string;
  price: number;
  quantity: number;
  status: string;
  g2a_order_id?: string;
  delivered_key?: string;
  product_name?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  todayRevenue: number;
  todayPayments: number;
  averageOrderValue: number;
}

export interface WishlistStats {
  totalWishlists: number;
  totalItems: number;
  averageItemsPerUser: number;
  mostWishlistedProducts: Array<{
    product_id: string;
    product_name: string;
    wishlist_count: number;
  }>;
}

export interface CartStats {
  totalCarts: number;
  totalItems: number;
  totalValue: number;
  averageCartValue: number;
  abandonedCarts: number;
  conversionRate: number;
}

export interface SchedulerStatus {
  isRunning: boolean;
  nextRun?: string;
  lastRun?: string;
  jobCount: number;
  syncFrequency?: string;
}

export interface ProductSyncStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lastSyncTime?: string;
  syncStatus: 'idle' | 'running' | 'success' | 'error';
}

export class AdminService {
  constructor(private api: AxiosInstance) {}

  async getDashboardStats(): Promise<AdminStats> {
    try {
      const [usersResponse, ordersResponse, productsResponse] = await Promise.all([
        this.api.get('/admin/users'),
        this.api.get('/orders/admin/all?limit=1000'),
        this.api.get('/products/?limit=1000')
      ]);

      const users = usersResponse.data;
      const orders = ordersResponse.data.orders || [];
      const products = productsResponse.data.products || [];

      const totalRevenue = orders.reduce((sum: number, order: AdminOrder) => 
        sum + (order.total_price || order.price || 0), 0
      );
      
      const completedOrders = orders.filter((order: AdminOrder) => 
        order.status === 'complete' || order.payment_status === 'paid'
      ).length;
      
      const pendingOrders = orders.filter((order: AdminOrder) => 
        order.status === 'pending' || order.payment_status === 'pending'
      ).length;

      const today = new Date().toDateString();
      const todayOrders = orders.filter((order: AdminOrder) => 
        new Date(order.created_at).toDateString() === today
      );
      
      const todayRevenue = todayOrders.reduce((sum: number, order: AdminOrder) => 
        sum + (order.total_price || order.price || 0), 0
      );

      const activeUsers = Array.isArray(users) ? users.filter((user: AdminUser) => user.is_active).length : users.length || 0;
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsersThisWeek = Array.isArray(users) ? users.filter((user: AdminUser) => 
        new Date(user.created_at) > weekAgo
      ).length : 0;

      return {
        totalUsers: Array.isArray(users) ? users.length : users.total || 0,
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        pendingOrders,
        completedOrders,
        todayRevenue,
        todayOrders: todayOrders.length,
        activeUsers,
        newUsersThisWeek
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        pendingOrders: 0,
        completedOrders: 0,
        todayRevenue: 0,
        todayOrders: 0,
        activeUsers: 0,
        newUsersThisWeek: 0
      };
    }
  }

  async getUsers(skip = 0, limit = 100): Promise<{ users: AdminUser[]; total: number }> {
    const response = await this.api.get('/admin/users', {
      params: { skip, limit }
    });
    return {
      users: Array.isArray(response.data) ? response.data : response.data.users || [],
      total: Array.isArray(response.data) ? response.data.length : response.data.total || 0
    };
  }

  async getUserById(userId: number): Promise<AdminUser> {
    const response = await this.api.get(`/admin/users/${userId}`);
    return response.data;
  }

  async createUser(userData: {
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    password: string;
    role: 'customer' | 'supplier' | 'manager' | 'admin';
  }): Promise<AdminUser> {
    const response = await this.api.post('/admin/users', userData);
    return response.data;
  }

  async updateUserRole(userId: number, role: 'customer' | 'supplier' | 'manager' | 'admin'): Promise<void> {
    await this.api.put(`/admin/users/${userId}/role?new_role=${role}`);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.api.delete(`/admin/users/${userId}`);
  }

  async getOrders(skip = 0, limit = 100): Promise<{ orders: AdminOrder[]; total: number }> {
    const response = await this.api.get('/orders/admin/all', {
      params: { skip, limit }
    });
    return {
      orders: response.data.orders || [],
      total: response.data.total || 0
    };
  }

  async cancelOrder(orderId: number, reason: string): Promise<AdminOrder> {
    const response = await this.api.post(`/orders/admin/${orderId}/cancel`, { reason });
    return response.data;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<AdminOrder> {
    const response = await this.api.put(`/orders/admin/${orderId}/status`, { status });
    return response.data;
  }

  // Payment Management
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      const ordersResponse = await this.api.get('/orders/admin/all?limit=1000');
      const orders = ordersResponse.data.orders || [];

      const totalPayments = orders.filter((order: AdminOrder) => 
        order.payment_status === 'paid'
      ).length;

      const totalRevenue = orders
        .filter((order: AdminOrder) => order.payment_status === 'paid')
        .reduce((sum: number, order: AdminOrder) => sum + (order.total_price || order.price || 0), 0);

      const successfulPayments = orders.filter((order: AdminOrder) => 
        order.payment_status === 'paid'
      ).length;

      const failedPayments = orders.filter((order: AdminOrder) => 
        order.payment_status === 'failed'
      ).length;

      const pendingPayments = orders.filter((order: AdminOrder) => 
        order.payment_status === 'pending'
      ).length;

      const today = new Date().toDateString();
      const todayOrders = orders.filter((order: AdminOrder) => 
        new Date(order.created_at).toDateString() === today && order.payment_status === 'paid'
      );

      const todayRevenue = todayOrders.reduce((sum: number, order: AdminOrder) => 
        sum + (order.total_price || order.price || 0), 0
      );

      const todayPayments = todayOrders.length;
      const averageOrderValue = totalPayments > 0 ? totalRevenue / totalPayments : 0;
      
      return {
        totalPayments,
        totalRevenue,
        successfulPayments,
        failedPayments,
        pendingPayments,
        todayRevenue,
        todayPayments,
        averageOrderValue
      };
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
      return {
        totalPayments: 0,
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        todayRevenue: 0,
        todayPayments: 0,
        averageOrderValue: 0
      };
    }
  }

  // Wishlist Analytics
  async getWishlistStats(): Promise<WishlistStats> {
    try {
      const response = await this.api.get('/wishlist/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch wishlist stats:', error);
      return {
        totalWishlists: 0,
        totalItems: 0,
        averageItemsPerUser: 0,
        mostWishlistedProducts: []
      };
    }
  }

  // Cart Analytics
  async getCartStats(): Promise<CartStats> {
    try {
      const response = await this.api.get('/cart/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cart stats:', error);
      return {
        totalCarts: 0,
        totalItems: 0,
        totalValue: 0,
        averageCartValue: 0,
        abandonedCarts: 0,
        conversionRate: 0
      };
    }
  }

  // Scheduler Management
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    try {
      const response = await this.api.get('/scheduler/status');
      return {
        isRunning: response.data.scheduler_running || false,
        nextRun: response.data.next_run,
        lastRun: response.data.last_run,
        jobCount: response.data.job_count || 0,
        syncFrequency: response.data.sync_frequency
      };
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
      return {
        isRunning: false,
        jobCount: 0
      };
    }
  }

  async getSchedulerJobs(): Promise<any[]> {
    try {
      const response = await this.api.get('/scheduler/jobs');
      return response.data.jobs || [];
    } catch (error) {
      console.error('Failed to fetch scheduler jobs:', error);
      return [];
    }
  }

  async triggerManualSync(): Promise<{ message: string }> {
    const response = await this.api.post('/scheduler/sync/manual');
    return response.data;
  }

  async updateSyncSchedule(hour: number, minute: number = 0): Promise<{ message: string }> {
    const response = await this.api.put(`/scheduler/schedule/interval/?hours=${hour}&minutes=${minute}`);
    return response.data;
  }

  // Product Management
  async getProductSyncStats(): Promise<ProductSyncStats> {
    try {
      const response = await this.api.get('/products/?limit=1');
      const schedulerStatus = await this.getSchedulerStatus();
      
      return {
        totalProducts: response.data.total || 0,
        activeProducts: response.data.total || 0, // Assuming all are active for now
        inactiveProducts: 0,
        lastSyncTime: schedulerStatus.lastRun,
        syncStatus: schedulerStatus.isRunning ? 'running' : 'idle'
      };
    } catch (error) {
      console.error('Failed to fetch product sync stats:', error);
      return {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        syncStatus: 'error'
      };
    }
  }
}
