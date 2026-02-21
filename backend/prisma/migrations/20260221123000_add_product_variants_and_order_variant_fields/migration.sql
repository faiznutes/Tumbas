ALTER TABLE "products"
ADD COLUMN "weight_gram" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN "variants" JSONB;

ALTER TABLE "orders"
ADD COLUMN "selected_variant_key" TEXT,
ADD COLUMN "selected_variant_label" TEXT,
ADD COLUMN "item_weight_gram" INTEGER NOT NULL DEFAULT 1000;
