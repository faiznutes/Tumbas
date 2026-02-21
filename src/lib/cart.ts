export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  variantKey?: string;
  variantLabel?: string;
};

const CART_KEY = "cart";
const CART_EVENT = "tumbas:cart-updated";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.price === "number" &&
    typeof item.image === "string" &&
    typeof item.quantity === "number"
  );
}

function normalizeItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const rawSlug = typeof item.slug === "string" && item.slug.trim() ? item.slug : item.productId;
  const candidate: CartItem = {
    id: String(item.id ?? `${item.productId}-${rawSlug}`),
    productId: String(item.productId ?? ""),
    slug: String(rawSlug ?? ""),
    title: String(item.title ?? "Produk"),
    description: String(item.description ?? ""),
    price: Number(item.price ?? 0),
    image: String(item.image ?? "https://via.placeholder.com/400"),
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    variantKey: typeof item.variantKey === "string" ? item.variantKey : undefined,
    variantLabel: typeof item.variantLabel === "string" ? item.variantLabel : undefined,
  };
  if (!candidate.productId || !candidate.slug || !Number.isFinite(candidate.price)) return null;
  return candidate;
}

function emitCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (isCartItem(item) ? item : normalizeItem(item)))
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  emitCartUpdated();
}

export function addToCart(item: Omit<CartItem, "quantity" | "id">, quantity = 1) {
  const current = getCartItems();
  const key = `${item.productId}:${item.slug}:${item.variantKey || "default"}`;
  const existingIndex = current.findIndex((cartItem) => `${cartItem.productId}:${cartItem.slug}:${cartItem.variantKey || "default"}` === key);

  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      quantity: current[existingIndex].quantity + Math.max(1, quantity),
    };
  } else {
    current.push({
      id: key,
      quantity: Math.max(1, quantity),
      ...item,
    });
  }

  saveCartItems(current);
}

export function updateCartQuantity(id: string, quantity: number) {
  const current = getCartItems();
  const next = current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
  saveCartItems(next);
}

export function removeCartItem(id: string) {
  const current = getCartItems();
  saveCartItems(current.filter((item) => item.id !== id));
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}

export function onCartUpdated(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = () => listener();
  window.addEventListener(CART_EVENT, wrapped);
  window.addEventListener("storage", wrapped);
  return () => {
    window.removeEventListener(CART_EVENT, wrapped);
    window.removeEventListener("storage", wrapped);
  };
}
