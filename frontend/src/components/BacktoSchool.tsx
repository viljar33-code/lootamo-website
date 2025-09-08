import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

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

export default function BacktoSchool() {
  return (
    <section className="w-full flex justify-center py-10 bg-gray-50">
      <div className="w-full max-w-[1170px] px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Back to School</h2>
            <Link href="#" className="text-sm text-gray-700 hover:text-black">
              See all
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            Explore the most popular game keys trending this week. Grab your
            favorites before they sell out!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              
              <div className="relative w-full h-48">
                <Image
                  src={game.coverImage}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-bold mb-2 line-clamp-3">
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
    </section>
  );
}