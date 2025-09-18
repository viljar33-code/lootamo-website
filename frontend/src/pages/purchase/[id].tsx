/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

async function fetchProductById(id: string) {
  const gotham = {
    id: "10000326126020",
    name: "Gotham Knights | Deluxe Edition (Xbox Series X/S, Windows 10) - Xbox Live Key - EUROPE",
    minPrice: 23.6,
    retail_min_price: 20.74,
    retailMinBasePrice: 18.3,
    availableToBuy: true,
    qty: 1006,
    thumbnail:
      "https://images.g2a.com/g2a/58x58/0x1x1/af9f94afbeee/4cc70c286fbe4652abf1b76d",
    smallImage:
      "https://images.g2a.com/g2a/230x336/0x1x1/05e2164f4740/4cc70c286fbe4652abf1b76d",
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/2a9a9b18a8ea/4cc70c286fbe4652abf1b76d",
    images: [
      "https://images.g2a.com/g2a/0x0/1x1x1/2a3d2f5a2b77/ecfe937ab0f54bd384c10565",
      "https://images.g2a.com/g2a/0x0/1x1x1/d6d1203125bc/8aefa46202ae492984307e80",
      "https://images.g2a.com/g2a/0x0/1x1x1/b6a5682e8086/e83b9cba5d3e461cb2ac6750",
    ],
    release_date: "2022-10-21",
    developer: "WB Games Montréal",
    publisher: "WB Games",
    region: "EUROPE",
    platform: "Xbox/Windows 10",
    categories: [
      { id: 189, name: "Games" },
      { id: 1545, name: "Adventure" },
      { id: 1550, name: "RPG" },
      { id: 2699, name: "Action" },
    ],
    restrictions: {
      pegi_violence: true,
      pegi_profanity: false,
    },
    requirements: {
      minimal: {
        reqprocessor: "Intel i5",
        reqgraphics: "GTX 660",
        reqmemory: "8GB RAM",
        reqdiskspace: "50GB",
      },
      recommended: {
        reqprocessor: "Intel i7",
        reqgraphics: "GTX 1070",
        reqmemory: "16GB RAM",
        reqdiskspace: "50GB",
      },
    },
  } as const;

  const callistoGlobal = {
    id: "10000326295025",
    name: "The Callisto Protocol (PC) - Steam Gift - GLOBAL",
    type: "egoods",
    slug: "/the-callisto-protocol-pc-steam-gift-global-i10000326295025",
    qty: 600,
    minPrice: 69.96,
    retail_min_price: 69.96,
    retailMinBasePrice: 69.96,
    availableToBuy: true,
    thumbnail:
      "https://images.g2a.com/g2a/58x58/0x1x1/9e34de7c546d/6950fb8e86a044f387c99e71",
    smallImage:
      "https://images.g2a.com/g2a/230x336/0x1x1/05e2164f4740/4cc70c286fbe4652abf1b76d",
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/0ce7828deb06/6950fb8e86a044f387c99e71",
    images: [
      "https://images.g2a.com/g2a/0x0/1x1x1/40ee47d53b6f/669317195bd3428d9aafbc27",
      "https://images.g2a.com/g2a/0x0/1x1x1/b5eb5fe7f5eb/f02a0576e58d4787ae07ecf3",
      "https://images.g2a.com/g2a/0x0/1x1x1/3ad62d88026a/d568c9af3e06439baba028cf",
    ],
    updated_at: "2025-09-08 17:33:16",
    release_date: "2022-12-02",
    region: "GLOBAL",
    developer: "Striking Distance Studios",
    publisher: "Krafton",
    platform: "PC (Steam)",
    restrictions: {
      pegi_violence: true,
      pegi_profanity: true,
      pegi_discrimination: false,
      pegi_drugs: false,
      pegi_fear: false,
      pegi_gambling: false,
      pegi_online: false,
      pegi_sex: false,
    },
    requirements: {
      minimal: {
        reqprocessor: "Intel Core i5-7500 / AMD Ryzen 3 1200 4 Cores",
        reqgraphics: "NVIDIA® GeForce® GTX 1060 or AMD Radeon™ RX 580",
        reqmemory: "8 GB RAM",
        reqdiskspace: "75 GB available space",
        reqsystem: "Windows 10/11",
        reqother: "",
      },
      recommended: {
        reqprocessor: "AMD Athlon 5350 (6 Available Cores )",
        reqgraphics: "NVIDIA® GeForce® GTX 1070 or AMD Radeon™ RX 5700",
        reqmemory: "8 GB RAM",
        reqdiskspace: "75 GB available space",
        reqsystem: "Windows 10/11",
        reqother: "",
      },
    },
    categories: [{ id: 1543, name: "Horror" }],
  } as const;

  const callistoEurope = {
    id: "10000326295027",
    name: "The Callisto Protocol (PC) - Steam Gift - EUROPE",
    type: "egoods",
    slug: "/the-callisto-protocol-pc-steam-gift-europe-i10000326295027",
    qty: 600,
    minPrice: 71.16,
    retail_min_price: 71.16,
    retailMinBasePrice: 71.16,
    availableToBuy: true,
    thumbnail:
      "https://images.g2a.com/g2a/58x58/0x1x1/9e34de7c546d/6950fb8e86a044f387c99e71",
    smallImage:
      "https://images.g2a.com/g2a/230x336/0x1x1/8432269ed6aa/6950fb8e86a044f387c99e71",
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/0ce7828deb06/6950fb8e86a044f387c99e71",
    images: [
      "https://images.g2a.com/g2a/0x0/1x1x1/40ee47d53b6f/669317195bd3428d9aafbc27",
      "https://images.g2a.com/g2a/0x0/1x1x1/b5eb5fe7f5eb/f02a0576e58d4787ae07ecf3",
      "https://images.g2a.com/g2a/0x0/1x1x1/3ad62d88026a/d568c9af3e06439baba028cf",
    ],
    updated_at: "2025-09-09 05:44:10",
    release_date: "2022-12-02",
    region: "EUROPE",
    developer: "Striking Distance Studios",
    publisher: "Krafton",
    platform: "PC (Steam)",
    restrictions: {
      pegi_violence: true,
      pegi_profanity: true,
      pegi_discrimination: false,
      pegi_drugs: false,
      pegi_fear: false,
      pegi_gambling: false,
      pegi_online: false,
      pegi_sex: false,
    },
    requirements: {
      minimal: {
        reqprocessor: "Intel Core i5-7500 / AMD Ryzen 3 1200 4 Cores",
        reqgraphics: "NVIDIA® GeForce® GTX 1060 or AMD Radeon™ RX 580",
        reqmemory: "8 GB RAM",
        reqdiskspace: "75 GB available space",
        reqsystem: "Windows 10/11",
        reqother: "",
      },
      recommended: {
        reqprocessor: "AMD Athlon 5350 (6 Available Cores )",
        reqgraphics: "NVIDIA® GeForce® GTX 1070 or AMD Radeon™ RX 5700",
        reqmemory: "8 GB RAM",
        reqdiskspace: "75 GB available space",
        reqsystem: "Windows 10/11",
        reqother: "",
      },
    },
    categories: [{ id: 1543, name: "Horror" }],
  } as const;

  const byId: Record<string, any> = {
    [gotham.id]: { ...gotham, related: [callistoGlobal, callistoEurope] },
    [callistoGlobal.id]: { ...callistoGlobal, related: [callistoEurope] },
    [callistoEurope.id]: { ...callistoEurope, related: [callistoGlobal] },
  };

  if (byId[id]) return byId[id];
  await new Promise((r) => setTimeout(r, 300));
  return null;
}

export default function PurchasePage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"details" | "requirements" | "restrictions">(
    "details"
  );

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const data = await fetchProductById(id);
        if (mounted) {
          setProduct(data);
          setActiveImage(data?.coverImage || data?.smallImage || null);
        }
      } catch (e) {
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const pageTitle = useMemo(
    () => (product ? `${product.name} • Purchase` : "Purchase"),
    [product]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <p className="text-gray-600 mb-6">
            We couldn’t find the item you were looking for. Please go back and
            try another product.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 mt-10">
        
        <nav className="text-sm text-gray-600 mb-4">
          <Link
            href="/"
            className="hover:underline transition-all duration-300"
          >
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">Purchase</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          
          <div className="lg:flex-1 bg-white rounded-xl shadow-sm p-4 transition-all duration-300">
            <div className="relative w-full h-[360px] rounded-lg overflow-hidden transition-all duration-300">
              <Image
                src={activeImage || product.coverImage || product.smallImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>

            {Boolean(product.images?.length) && (
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide p-2">
                {product.images.map((src: string, idx: number) => (
                  <div
                    key={idx}
                    className={`relative w-28 h-20 rounded overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-all duration-300 ${
                      activeImage === src
                        ? "border-blue-600"
                        : "border-transparent"
                    } hover:scale-105`}
                    onClick={() => setActiveImage(src)}
                  >
                    <Image
                      src={src}
                      alt={`screenshot-${idx}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="lg:flex-[0.6] bg-white rounded-xl shadow-sm p-4 flex flex-col gap-4 transition-all duration-300">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              {product.name}
            </h1>

            <div className="flex flex-wrap gap-2">
              {product.categories?.map((c: any) => (
                <span
                  key={c.id}
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded transition-all duration-300 hover:bg-blue-200"
                >
                  {c.name}
                </span>
              ))}
              {product.region && (
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                  Region: {product.region}
                </span>
              )}
              {product.platform && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded">
                  Platform: {product.platform}
                </span>
              )}
            </div>

            
            <div className="flex gap-4 border-b mt-4">
              {["details", "requirements", "restrictions"].map((t) => (
                <button
                  key={t}
                  className={`pb-2 font-medium transition-all duration-300 ${
                    tab === t
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                  onClick={() => setTab(t as any)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="mt-3 text-sm text-gray-700 space-y-2 transition-all duration-300">
              {tab === "details" && (
                <>
                  <div>
                    <span className="font-medium">Developer:</span>{" "}
                    {product.developer || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Publisher:</span>{" "}
                    {product.publisher || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Release Date:</span>{" "}
                    {product.release_date || "—"}
                  </div>
                </>
              )}

              {tab === "requirements" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold mb-1">Minimal</div>
                    <div className="space-y-1">
                      {(
                        Object.entries(product.requirements?.minimal || {}) as [
                          string,
                          string
                        ][]
                      ).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-medium">
                            {k.replace("req", "")}:
                          </span>{" "}
                          {v || "—"}
                        </div>
                      ))}
                    </div>
                  </div>
                  {Boolean(product.requirements?.recommended) && (
                    <div>
                      <div className="font-semibold mb-1">Recommended</div>
                      <div className="space-y-1">
                        {(
                          Object.entries(product.requirements.recommended) as [
                            string,
                            string
                          ][]
                        ).map(([k, v]) => (
                          <div key={k}>
                            <span className="font-medium">
                              {k.replace("req", "")}:
                            </span>{" "}
                            {v || "—"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "restrictions" && (
                <div className="space-y-1">
                  {Boolean(product.restrictions) &&
                  Object.entries(product.restrictions || {}).length > 0 ? (
                    Object.entries(product.restrictions || {}).map(([k, v]) => (
                      <div key={k}>
                        <span className="font-medium">
                          {k.replace("pegi_", "")}:
                        </span>{" "}
                        {v ? "Yes" : "No"}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No restrictions listed
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          
          <aside className="lg:flex-[0.4] bg-white rounded-xl shadow-sm p-4 sticky top-20 transition-all duration-300">
            {product.retail_min_price &&
              product.retail_min_price > product.minPrice && (
                <div className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mb-2 transition-all duration-300">
                  Discount
                </div>
              )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ${product.minPrice.toFixed(2)}
              </span>
              {product.retail_min_price &&
                product.retail_min_price > product.minPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.retail_min_price.toFixed(2)}
                  </span>
                )}
            </div>

            <div className="mt-2 text-sm font-medium text-green-600">
              {product.availableToBuy ? "In Stock" : "Unavailable"}
            </div>

            <div className="mt-3 flex gap-2 items-center">
              <label>Qty:</label>
              <input
                type="number"
                min={1}
                max={product.qty}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1 text-sm transition-all duration-300"
              />
            </div>

            <button
              disabled={!product.availableToBuy}
              className={`w-full mt-4 py-2 rounded text-white font-medium transition-all duration-300 ${
                product.availableToBuy
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {product.availableToBuy ? "Proceed to Checkout" : "Unavailable"}
            </button>

            <div className="mt-4 flex flex-col gap-1 text-sm text-gray-700 transition-all duration-300">
              <span>Digital key • Instant delivery</span>
              <span>Secure checkout • Refund guarantee</span>
            </div>
          </aside>
        </div>

        
        {product.related?.length ? (
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-3">Other offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.related.map((p: any) => (
                <Link key={p.id} href={`/purchase/${p.id}`} className="block">
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-3">
                    <div className="flex gap-3">
                      <div className="relative w-20 h-28 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={p.smallImage || p.coverImage}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-2">{p.name}</div>
                        <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                          {p.region && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              {p.region}
                            </span>
                          )}
                          {p.platform && (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              {p.platform}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 font-bold">
                          ${p.minPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Footer />
    </>
  );
}
