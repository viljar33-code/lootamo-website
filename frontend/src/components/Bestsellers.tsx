import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

type Game = {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
};

const games: Game[] = [
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    image: "/images/game.jpeg",
    price: 19.99,
    originalPrice: 59.99,
    rating: 4.5,
  },
  {
    id: "rdr2",
    title: "Red Dead Redemption 2",
    image: "/images/game.jpeg",
    price: 24.99,
    originalPrice: 59.99,
    rating: 4.8,
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    image: "/images/game.jpeg",
    price: 39.99,
    originalPrice: 59.99,
    rating: 4.7,
  },
  {
    id: "gtav",
    title: "Grand Theft Auto V",
    image: "/images/game.jpeg",
    price: 14.99,
    originalPrice: 29.99,
    rating: 4.6,
  },
];

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const items = Array.from({ length: 5 }, (_, i) => {
    const filled = i < full || (i === full && hasHalf);
    return (
      <FaStar
        key={i}
        className={filled ? "text-yellow-400" : "text-gray-300"}
        size={14}
      />
    );
  });
  return <div className="flex items-center gap-1">{items}</div>;
}

export default function Bestsellers() {
  return (
    <section id="bestsellers" className="w-full flex justify-center py-10">
      <div className="w-full max-w-[1170px] px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Bestsellers</h2>
          <Link href="#" className="text-sm text-gray-700 hover:text-black">See all</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => {
            const discount = game.originalPrice
              ? Math.round(((game.originalPrice - game.price) / game.originalPrice) * 100)
              : 0;
            return (
              <Link
                key={game.id}
                href={`/product/${game.id}`}
                className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow hover:shadow-lg transition-shadow"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 rounded bg-green-500 text-white text-xs font-bold px-2 py-1">
                      -{discount}%
                    </span>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px]">
                    {game.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <Stars value={game.rating} />
                    <div className="text-right">
                      <div className="text-base font-bold text-gray-900">${game.price.toFixed(2)}</div>
                      {game.originalPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          ${game.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}