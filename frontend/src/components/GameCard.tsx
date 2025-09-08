import Image from "next/image";
import React from "react";

export default function GameCard() {
  const game = {
    id: "10000326126020",
    name: "Gotham Knights | Deluxe Edition (Xbox Series X/S, Windows 10) - Xbox Live Key - EUROPE",
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
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-xs">
        <Image
          src={game.coverImage}
          alt={game.name}
          width={400}
          height={400}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2">{game.name}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {game.categories.map((cat) => (
              <span
                key={cat.id}
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
              >
                {cat.name}
              </span>
            ))}
          </div>
          <p className="text-gray-600 text-sm mb-1">
            Developer: <span className="font-medium">{game.developer}</span>
          </p>
          <p className="text-gray-600 text-sm mb-1">
            Publisher: <span className="font-medium">{game.publisher}</span>
          </p>
          <p className="text-gray-600 text-sm mb-2">
            Release Date:{" "}
            <span className="font-medium">{game.release_date}</span>
          </p>
          <p className="text-gray-900 font-bold mb-3">${game.minPrice}</p>
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
    </>
  );
}
