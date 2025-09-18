import Image from "next/image";
import Link from "next/link";

const games = [
  {
    id: "10000326126020",
    name: "Gotham Knights | Deluxe Edition (Xbox Series X/S, Windows 10)",
    minPrice: 23.6,
    release_date: "2022-10-21",
    developer: "WB Games Montréal",
    publisher: "WB Games",
    availableToBuy: true,
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/2a9a9b18a8ea/4cc70c286fbe4652abf1b76d",
    categories: [
      { id: 189, name: "Games" },
      { id: 1545, name: "Adventure" },
      { id: 1550, name: "RPG" },
      { id: 2699, name: "Action" },
    ],
  },
  {
    id: "10000326126021",
    name: "Cyberpunk 2077 | Standard Edition (PC, Steam)",
    minPrice: 19.99,
    release_date: "2020-12-10",
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    availableToBuy: true,
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/2a9a9b18a8ea/4cc70c286fbe4652abf1b76d",
    categories: [
      { id: 190, name: "Games" },
      { id: 1546, name: "RPG" },
      { id: 2700, name: "Action" },
    ],
  },
  {
    id: "10000326126022",
    name: "Assassin's Creed Valhalla | Deluxe Edition (Xbox One/Series X)",
    minPrice: 29.5,
    release_date: "2020-11-10",
    developer: "Ubisoft Montreal",
    publisher: "Ubisoft",
    availableToBuy: true,
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/2a9a9b18a8ea/4cc70c286fbe4652abf1b76d",
    categories: [
      { id: 191, name: "Games" },
      { id: 1547, name: "Adventure" },
      { id: 1551, name: "Action" },
    ],
  },
  {
    id: "10000326126023",
    name: "FIFA 23 | Standard Edition (PC, Origin)",
    minPrice: 49.99,
    release_date: "2022-09-30",
    developer: "EA Vancouver",
    publisher: "Electronic Arts",
    availableToBuy: false,
    coverImage:
      "https://images.g2a.com/g2a/0x0/1x1x1/2a9a9b18a8ea/4cc70c286fbe4652abf1b76d",
    categories: [
      { id: 192, name: "Games" },
      { id: 1548, name: "Sports" },
    ],
  },
];

export default function Software() {
  return (
    <section className="w-full flex justify-center py-8 lg:py-10">
      <div className="w-full max-w-7xl px-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            Software
            </h2>
            <Link href="#" className="text-sm text-gray-700 hover:text-black">
              See all
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-1">
          Get essential software tools and licenses at discounted prices.
          </p>
        </div>

    <div className="overflow-x-auto">
              <div className="flex gap-x-3 gap-y-16 w-max lg:grid lg:grid-cols-4 lg:gap-x-6 lg:w-auto">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white w-[220px] flex-shrink-0 lg:w-auto shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                  >
                    <Image
                      src={game.coverImage}
                      alt={game.name}
                      width={400}
                      height={400}
                      className="w-full h-48 object-cover"
                    />
    
                    <div className="p-2 lg:p-4 flex flex-col flex-1">
                      <h3 className="text-base lg:text-lg font-bold mb-2 line-clamp-3 leading-tight">
                        {game.name}
                      </h3>
    
                      <div className="flex flex-wrap gap-2 mb-3">
                        {game.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
    
                      <p className="text-gray-600 text-sm mb-1 truncate">
                        Developer:{" "}
                        <span className="font-medium">{game.developer}</span>
                      </p>
                      <p className="text-gray-600 text-sm mb-1 truncate">
                        Publisher:{" "}
                        <span className="font-medium">{game.publisher}</span>
                      </p>
                      <p className="text-gray-600 text-sm mb-3">
                        Release:{" "}
                        <span className="font-medium">{game.release_date}</span>
                      </p>
    
                      <div className="mt-auto">
                        <p className="text-gray-900 font-bold text-lg mb-2">
                          ${game.minPrice}
                        </p>
                        <button
                          disabled={!game.availableToBuy}
                          className={`w-full py-2 rounded text-white font-medium ${
                            game.availableToBuy
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {game.availableToBuy ? "Buy Now" : "Unavailable"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
      </div>
    </section>
  );
}
