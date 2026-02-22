const API_BASE = process.env.API_BASE || "https://tumbas.faiznute.site/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Set ADMIN_EMAIL dan ADMIN_PASSWORD terlebih dahulu.");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function imageSet(tags, lockSeed) {
  return [
    { url: `https://loremflickr.com/900/900/${tags}?lock=${lockSeed}`, position: 0 },
    { url: `https://loremflickr.com/900/900/${tags},aquarium?lock=${lockSeed + 1}`, position: 1 },
    { url: `https://loremflickr.com/900/900/${tags},pet?lock=${lockSeed + 2}`, position: 2 },
  ];
}

const DATA = [
  ["Cupang Galaxy Premium", "Ikan Hias", "cupang,betta", 85000],
  ["Cupang Halfmoon Import", "Ikan Hias", "cupang,betta", 95000],
  ["Cupang Koi Nemo", "Ikan Hias", "cupang,betta", 78000],
  ["Cupang Avatar Biru", "Ikan Hias", "cupang,betta", 89000],
  ["Cupang Giant Red", "Ikan Hias", "cupang,betta", 120000],
  ["Channa Andrao Juvenile", "Ikan Hias", "channa,fish", 135000],
  ["Channa Barca Super", "Ikan Hias", "channa,fish", 215000],
  ["Channa Pulchra Local", "Ikan Hias", "channa,fish", 165000],
  ["Molly Balon Mix", "Ikan Hias", "molly,fish", 35000],
  ["Molly Black Premium", "Ikan Hias", "molly,fish", 32000],
  ["Guppy Blue Moscow", "Ikan Hias", "guppy,fish", 48000],
  ["Guppy Red Dragon", "Ikan Hias", "guppy,fish", 52000],
  ["Guppy Full Platinum", "Ikan Hias", "guppy,fish", 56000],
  ["Neon Tetra Paket 20 Ekor", "Ikan Hias", "tetra,fish", 42000],
  ["Koki Oranda Sakura", "Ikan Hias", "goldfish,oranda", 74000],
  ["Kura Air Brazil Mini", "Reptil", "turtle,reptile", 110000],
  ["Leopard Gecko Baby", "Reptil", "gecko,reptile", 260000],
  ["Bearded Dragon Juvenile", "Reptil", "bearded-dragon,reptile", 390000],
  ["Corn Snake Motif Snow", "Reptil", "snake,reptile", 450000],
  ["Ball Python Pastel", "Reptil", "python,reptile", 520000],
  ["Iguana Hijau Jinak", "Reptil", "iguana,reptile", 310000],
  ["Katak Pacman Green", "Reptil", "frog,exotic", 180000],
  ["Axolotl Leucistic", "Hewan Eksotis", "axolotl,pet", 270000],
  ["Landak Mini Albino", "Hewan Eksotis", "hedgehog,pet", 340000],
  ["Sugar Glider Pair", "Hewan Eksotis", "sugar-glider,pet", 620000],
  ["Hamster Syrian Longhair", "Hewan Eksotis", "hamster,pet", 95000],
  ["Kelinci Holland Lop", "Hewan Eksotis", "rabbit,pet", 280000],
  ["Musang Mini Jinak", "Hewan Eksotis", "exotic-animal,pet", 480000],
  ["Udang Hias Blue Dream", "Ikan Hias", "shrimp,aquarium", 65000],
  ["Ikan Discus Red Cover", "Ikan Hias", "discus,fish", 245000],
];

async function apiFetch(path, options = {}) {
  const customHeaders = options.headers || {};
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  });
  const text = await response.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: response.ok, status: response.status, json };
}

async function run() {
  const loginRes = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok || !loginRes.json.accessToken) {
    throw new Error(`Login gagal: ${loginRes.status} ${JSON.stringify(loginRes.json)}`);
  }

  const token = loginRes.json.accessToken;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < DATA.length; i++) {
    const [title, category, tags, price] = DATA[i];
    const slug = slugify(title);

    const existing = await apiFetch(`/products/${slug}`);
    if (existing.ok) {
      skipped += 1;
      continue;
    }

    const body = {
      title,
      slug,
      description: `${title} kategori ${category} dengan kondisi sehat, aktif, dan siap kirim. Gambar produk menggunakan format JPEG terkompresi via CDN agar ringan.`,
      price,
      stock: 12 + (i % 9),
      category,
      weightGram: 500 + (i % 5) * 200,
      images: imageSet(tags, 7000 + i * 10),
    };

    const create = await apiFetch("/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (create.ok) {
      created += 1;
    } else {
      console.log(`Gagal create ${slug}:`, create.status, create.json);
    }
  }

  console.log(JSON.stringify({ created, skipped, total: DATA.length }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
