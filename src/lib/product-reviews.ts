export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

const AUTHORS = [
  "Andi", "Nadia", "Rizky", "Salsa", "Bima", "Tari", "Dimas", "Rani", "Fajar", "Aulia",
  "Putra", "Nabila", "Riko", "Maya", "Ari", "Devi", "Galih", "Sinta", "Reza", "Lala",
  "Farhan", "Niko", "Tiara", "Yusuf", "Intan", "Bagas", "Nina", "Adit", "Rara", "Vina",
];

const COMMENTS = [
  "Kualitas produk sangat bagus, sesuai deskripsi.",
  "Pengiriman cepat, packing aman, recommended.",
  "Barang sampai dengan kondisi prima, seller responsif.",
  "Worth it untuk harganya, akan beli lagi.",
  "Produk original, performa sesuai ekspektasi.",
  "Finishing rapi dan nyaman dipakai harian.",
  "Cocok untuk pemula maupun penghobi lama.",
  "Ada sedikit minus di kemasan, tapi produk tetap oke.",
  "Sudah dicoba beberapa hari, hasilnya memuaskan.",
  "Value for money, fiturnya lengkap.",
  "Warna dan tampilan lebih bagus dari foto.",
  "Stok sesuai, varian lengkap, puas belanja di sini.",
];

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededValue(seed: number, index: number, mod: number) {
  const next = (seed + (index + 1) * 2654435761) >>> 0;
  return next % mod;
}

export function getProductRatingSummary(slug: string) {
  const seed = hashText(slug || "product");
  const averageRaw = 38 + seededValue(seed, 1, 13);
  const average = Number((averageRaw / 10).toFixed(1));
  const total = 30 + seededValue(seed, 2, 571);
  return { average, total };
}

export function getHardcodedReviews(slug: string, productTitle: string): ProductReview[] {
  const seed = hashText(`${slug}:${productTitle}`);
  const now = new Date();

  return Array.from({ length: 30 }, (_, idx) => {
    const author = AUTHORS[seededValue(seed, idx, AUTHORS.length)];
    const commentBase = COMMENTS[seededValue(seed, idx + 9, COMMENTS.length)];
    const rating = 3 + seededValue(seed, idx + 17, 3);
    const dayOffset = seededValue(seed, idx + 23, 280);
    const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `${slug}-review-${idx + 1}`,
      author,
      rating,
      comment: `${commentBase} (${productTitle})`,
      date,
    };
  });
}
