const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_TIMEOUT_MS = 15000;

let authToken: string | null = null;

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }
  return null;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
      document.cookie = `authToken=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem('authToken');
      document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || getCookieValue('authToken');
  }
  return null;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: options?.signal ?? controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Pastikan backend aktif.');
    }
    if (error instanceof TypeError) {
      throw new Error('Tidak dapat terhubung ke server API. Pastikan backend aktif.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !endpoint.startsWith('/auth/login')
    ) {
      setAuthToken(null);
      localStorage.removeItem('user');

      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login?sessionExpired=1';
      }
    }

    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  weightGram: number;
  variants?: ProductVariant[] | null;
  status: 'AVAILABLE' | 'SOLD' | 'ARCHIVED';
  category: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
}

export interface ProductVariant {
  key: string;
  label: string;
  attribute1Name: string;
  attribute1Value: string;
  attribute2Name: string;
  attribute2Value: string;
  stock: number;
  price: number;
  weightGram: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  position: number;
}

export interface Order {
  id: string;
  orderCode: string;
  productId: string;
  amount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  midtransTransactionId: string | null;
  midtransOrderId: string | null;
  snapToken: string | null;
  shippedToExpedition?: boolean;
  expeditionResi?: string | null;
  expeditionName?: string | null;
  shippedAt?: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  notes: string | null;
  selectedVariantKey?: string | null;
  selectedVariantLabel?: string | null;
  itemWeightGram?: number;
  product: Product;
  orderItems?: OrderItem[];
  publicToken?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitleSnapshot: string;
  unitPrice: number;
  quantity: number;
  selectedVariantKey?: string | null;
  selectedVariantLabel?: string | null;
  itemWeightGram: number;
}

export interface PublicOrder {
  id: string;
  orderCode: string;
  amount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  shippedToExpedition?: boolean;
  expeditionResi?: string | null;
  expeditionName?: string | null;
  shippedAt?: string | null;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    status: 'AVAILABLE' | 'SOLD' | 'ARCHIVED';
  };
  orderItems?: Array<{
    id: string;
    productId: string;
    productTitleSnapshot: string;
    unitPrice: number;
    quantity: number;
    selectedVariantKey?: string | null;
    selectedVariantLabel?: string | null;
    itemWeightGram: number;
  }>;
}

export interface ReceiptVerificationResult {
  valid: boolean;
  reason?: 'invalid_receipt_format' | 'receipt_not_found' | 'verification_code_mismatch' | 'invalid_resi_format' | 'resi_not_found' | 'not_shipped_to_expedition';
  order?: {
    id: string;
    orderCode: string;
    receiptNo: string;
    verificationCode: string;
    shippingResi?: string;
    shippedToExpedition?: boolean;
    expeditionResi?: string | null;
    expeditionName?: string | null;
    shippedAt?: string | null;
    productTitle: string;
    amount: number;
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  permissions?: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    products: number;
    orders: number;
  };
}

export interface WebhookMonitorResponse {
  rangeMinutes: number;
  since: string;
  summary: {
    totalReceived: number;
    processed: number;
    warning: number;
    failed: number;
    invalidSignature: number;
  };
  recentFailures: Array<{
    id: string;
    createdAt: string;
    orderId: string | null;
    status: string;
    attempts: number;
    error: string | null;
  }>;
}

export interface ApiListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShippingCity {
  cityId: string;
  provinceId: string;
  cityName: string;
  type: string;
  province: string;
  postalCode: string;
  label: string;
}

export interface ShippingRateService {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  subject: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';
  adminNotes: string | null;
  processedAt: string | null;
  processedById: string | null;
  createdAt: string;
  updatedAt: string;
  processedBy?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export interface AdminNoticeSettings {
  enabled: boolean;
  title: string;
  message: string;
}

export interface ShopHeroSettings {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
}

export const api = {
  products: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
      search?: string;
      sort?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      return fetchApi<{ data: Product[]; meta: ApiListMeta }>(`/products?${searchParams}`);
    },

    getBySlug: (slug: string) => fetchApi<Product>(`/products/${slug}`),

    create: (data: {
      title: string;
      slug: string;
      description?: string;
      price: number;
      stock?: number;
      category?: string;
      variants?: ProductVariant[] | null;
      weightGram?: number;
      images?: { url: string; position?: number }[];
    }) => fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id: string, data: Partial<{
      title: string;
      slug: string;
      description: string;
      price: number;
      stock: number;
      status: string;
      category: string;
      images: { url: string; position?: number }[];
      variants: ProductVariant[] | null;
      weightGram: number;
    }>) => fetchApi<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

    delete: (id: string) => fetchApi<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    }),

    bulkAction: (data: {
      action: 'DELETE' | 'MARK_SOLD' | 'CHANGE_STATUS';
      ids: string[];
      status?: string;
    }) => fetchApi<{ success: boolean }>('/products/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  orders: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      includeExpired?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      return fetchApi<{ data: Order[]; meta: ApiListMeta }>(`/orders?${searchParams}`);
    },

    getById: (id: string) => fetchApi<Order>(`/orders/${id}`),

    getPublicById: (id: string, token: string) => fetchApi<PublicOrder>(`/orders/${id}/public?token=${encodeURIComponent(token)}`),

    syncPaymentStatus: (id: string, token: string) =>
      fetchApi<PublicOrder>(`/orders/${id}/sync-payment?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      }),

    create: (data: {
      productId?: string;
      items?: Array<{
        productId: string;
        quantity: number;
        selectedVariantKey?: string;
        selectedVariantLabel?: string;
      }>;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerAddress: string;
      customerCity: string;
      customerPostalCode: string;
      notes?: string;
      shippingCost?: number;
      shippingProvider?: string;
      shippingRegion?: string;
      shippingService?: string;
      shippingEtd?: string;
      shippingWeightGram?: number;
      shippingDestinationCityId?: string;
      selectedVariantKey?: string;
      selectedVariantLabel?: string;
    }) => fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    verifyReceipt: (receiptNo: string, verificationCode: string) =>
      fetchApi<ReceiptVerificationResult>(
        `/orders/verify-receipt?receiptNo=${encodeURIComponent(receiptNo)}&verificationCode=${encodeURIComponent(verificationCode)}`,
      ),

    verifyResi: (resi: string) =>
      fetchApi<ReceiptVerificationResult>(
        `/orders/verify-resi?resi=${encodeURIComponent(resi)}`,
      ),

    confirmShipping: (id: string, data: { expeditionResi: string; expeditionName?: string }) =>
      fetchApi<Order>(`/orders/${id}/shipping/confirm`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    bulkConfirmShipping: (data: { orderIds: string[]; expeditionResi: string; expeditionName?: string }) =>
      fetchApi<{
        successCount: number;
        failedCount: number;
        success: Array<{ id: string; orderCode: string; expeditionResi: string }>;
        failed: Array<{ id: string; reason: string }>;
      }>('/orders/shipping/bulk-confirm', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  contactMessages: {
    create: (data: {
      name: string;
      email: string;
      phone?: string;
      whatsapp?: string;
      subject: string;
      message: string;
    }) => fetchApi<ContactMessage>('/contact-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      return fetchApi<{ data: ContactMessage[]; meta: ApiListMeta }>(`/contact-messages?${searchParams}`);
    },

    updateById: (id: string, data: { status?: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM'; adminNotes?: string }) =>
      fetchApi<ContactMessage>(`/contact-messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    bulkUpdate: (data: {
      ids: string[];
      status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';
      adminNotes?: string;
    }) =>
      fetchApi<{ updated: number }>('/contact-messages/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteById: (id: string) =>
      fetchApi<{ success: boolean }>(`/contact-messages/${id}`, {
        method: 'DELETE',
      }),

    bulkDelete: (ids: string[]) =>
      fetchApi<{ deleted: number }>('/contact-messages/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
  },

  auth: {
    me: () => fetchApi<User>('/auth/me'),

    login: (email: string, password: string) => 
      fetchApi<{ accessToken: string; access_token?: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (email: string, password: string, name?: string) =>
      fetchApi<{ accessToken: string; access_token?: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
  },

  users: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, String(value));
        });
      }
      return fetchApi<{ data: AdminUser[]; meta: ApiListMeta }>(`/users?${searchParams}`);
    },

    create: (data: {
      email: string;
      password: string;
      name?: string;
      role?: string;
      permissions?: string[];
    }) => fetchApi<AdminUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id: string, data: {
      name?: string;
      role?: string;
      permissions?: string[];
      isActive?: boolean;
    }) => fetchApi<AdminUser>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

    updatePassword: (id: string, password: string) => fetchApi<AdminUser>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),

    delete: (id: string) => fetchApi<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),

    toggleActive: (id: string) => fetchApi<AdminUser>(`/users/${id}/toggle-active`, {
      method: 'PATCH',
    }),
  },

  settings: {
    getGeneral: () => fetchApi<{
      storeName: string;
      storeEmail: string;
      storePhone: string;
      storeAddress: string;
    }>('/settings/general'),

    updateGeneral: (data: {
      storeName?: string;
      storeEmail?: string;
      storePhone?: string;
      storeAddress?: string;
    }) => fetchApi<{
      storeName: string;
      storeEmail: string;
      storePhone: string;
      storeAddress: string;
    }>('/settings/general', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getStore: () => fetchApi<{
      currency: string;
      taxRate: number;
    }>('/settings/store'),

    updateStore: (data: {
      currency?: string;
      taxRate?: number;
    }) => fetchApi<{
      currency: string;
      taxRate: number;
    }>('/settings/store', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getNotifications: () => fetchApi<{
      emailNotifications: boolean;
      orderNotifications: boolean;
      marketingEmails: boolean;
    }>('/settings/notifications'),

    getAdminNotice: () => fetchApi<AdminNoticeSettings>('/settings/admin-notice'),

    getAdminNoticePublic: () => fetchApi<AdminNoticeSettings>('/settings/admin-notice-public'),

    updateAdminNotice: (data: {
      enabled?: boolean;
      title?: string;
      message?: string;
    }) => fetchApi<AdminNoticeSettings>('/settings/admin-notice', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    updateNotifications: (data: {
      emailNotifications?: boolean;
      orderNotifications?: boolean;
      marketingEmails?: boolean;
    }) => fetchApi<{
      emailNotifications: boolean;
      orderNotifications: boolean;
      marketingEmails: boolean;
    }>('/settings/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getPromo: () => fetchApi<{
      heroImage: string;
      heroTitle: string;
      heroSubtitle: string;
      heroBadge: string;
      discountText: string;
    }>('/settings/promo'),

    getPromoPublic: () => fetchApi<{
      heroImage: string;
      heroTitle: string;
      heroSubtitle: string;
      heroBadge: string;
      discountText: string;
    }>('/settings/promo-public'),

    updatePromo: (data: {
      heroImage?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      heroBadge?: string;
      discountText?: string;
    }) => fetchApi<{
      heroImage: string;
      heroTitle: string;
      heroSubtitle: string;
      heroBadge: string;
      discountText: string;
    }>('/settings/promo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getWeeklyDeal: () => fetchApi<{
      title: string;
      subtitle: string;
      enabled: boolean;
      discount: number;
      endDate: string;
    }>('/settings/weekly-deal'),

    getWeeklyDealPublic: () => fetchApi<{
      title: string;
      subtitle: string;
      enabled: boolean;
      discount: number;
      endDate: string;
    }>('/settings/weekly-deal-public'),

    updateWeeklyDeal: (data: {
      title?: string;
      subtitle?: string;
      enabled?: boolean;
      discount?: number;
      endDate?: string;
    }) => fetchApi<{
      title: string;
      subtitle: string;
      enabled: boolean;
      discount: number;
      endDate: string;
    }>('/settings/weekly-deal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getHomepageFeatured: () => fetchApi<{
      manualSlugs: string[];
      maxItems: number;
    }>('/settings/homepage-featured'),

    getHomepageFeaturedPublic: () => fetchApi<{
      manualSlugs: string[];
      maxItems: number;
    }>('/settings/homepage-featured-public'),

    updateHomepageFeatured: (data: {
      manualSlugs?: string[];
      maxItems?: number;
    }) => fetchApi<{
      manualSlugs: string[];
      maxItems: number;
    }>('/settings/homepage-featured', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getPayment: () => fetchApi<{
      midtransEnabled: boolean;
      midtransClientKey: string;
      midtransServerKey: string;
      midtransIsProduction: boolean;
    }>('/settings/payment'),

    getPaymentPublic: () => fetchApi<{
      midtransEnabled: boolean;
      midtransClientKey: string;
      midtransIsProduction: boolean;
    }>('/settings/payment-public'),

    updatePayment: (data: {
      midtransEnabled?: boolean;
      midtransClientKey?: string;
      midtransServerKey?: string;
      midtransIsProduction?: boolean;
    }) => fetchApi<{
      midtransEnabled: boolean;
      midtransClientKey: string;
      midtransServerKey: string;
      midtransIsProduction: boolean;
    }>('/settings/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getShipping: () => fetchApi<{
      minFreeShipping: number;
      estimateJawa: number;
      estimateLuarJawa: number;
      providers: string[];
      originCityId: number;
      defaultWeightGram: number;
    }>('/settings/shipping'),

    getShippingPublic: () => fetchApi<{
      minFreeShipping: number;
      estimateJawa: number;
      estimateLuarJawa: number;
      providers: string[];
      originCityId: number;
      defaultWeightGram: number;
    }>('/settings/shipping-public'),

    updateShipping: (data: {
      minFreeShipping?: number;
      estimateJawa?: number;
      estimateLuarJawa?: number;
      providers?: string[];
      originCityId?: number;
      defaultWeightGram?: number;
    }) => fetchApi<{
      minFreeShipping: number;
      estimateJawa: number;
      estimateLuarJawa: number;
      providers: string[];
      originCityId: number;
      defaultWeightGram: number;
    }>('/settings/shipping', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getShopHero: () => fetchApi<ShopHeroSettings>('/settings/shop-hero'),

    getShopHeroPublic: () => fetchApi<ShopHeroSettings>('/settings/shop-hero-public'),

    updateShopHero: (data: Partial<ShopHeroSettings>) =>
      fetchApi<ShopHeroSettings>('/settings/shop-hero', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  shipping: {
    searchCities: (q: string, limit = 20) =>
      fetchApi<ShippingCity[]>(`/shipping/cities?q=${encodeURIComponent(q)}&limit=${limit}`),

    getRates: (data: {
      destinationCityId: string;
      courier: string;
      weightGram: number;
      originCityId?: string;
    }) =>
      fetchApi<{
        originCityId: string;
        destinationCityId: string;
        courier: string;
        weightGram: number;
        services: ShippingRateService[];
      }>('/shipping/rates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  webhooks: {
    getMidtransMonitor: (minutes = 60) =>
      fetchApi<WebhookMonitorResponse>(`/webhook/midtrans/monitor?minutes=${minutes}`),
  },
};
