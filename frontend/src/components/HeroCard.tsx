import Image from "next/image";

const games = [
  {
    title: "BORDERLANDS 4",
    description: "There's no such thing as too many guns!",
    tag: "PREORDER",
    tagColor: "bg-blue-500",
    image: "/images/heroCardImg1.jpeg",
  },
  {
    title: "BACK TO SCHOOL",
    description: "Get your FREE digital Smart Prompt Guide!",
    tag: "PROMO",
    tagColor: "bg-pink-500",
    image: "/images/heroCardImg2.avif",
  },
  {
    title: "HOLLOW KNIGHT: SILKSONG",
    description: "Steam • Global • Account",
    tag: "NEW",
    tagColor: "bg-green-500",
    image: "/images/heroCardImg3.webp",
  },
  {
    title: "EA SPORTS FC 26",
    description: "Steam • Global • Account",
    tag: "PREORDER",
    tagColor: "bg-blue-500",
    image: "/images/heroCardImg4.avif",
  },
];

export default function HeroCard() {
  return (
    <div className="overflow-x-auto pt-6 pb-10">
      <div className="flex w-max gap-4 p-6 xl:grid xl:grid-cols-4 xl:gap-6 xl:w-auto xl:max-w-7xl xl:mx-auto">
        {games.map((game, i) => (
          <div
            key={i}
            className="flex-shrink-0 hover:bg-sky-100 hover:scale-105 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border border-gray-200 bg-white"
          >
            <div className="relative h-[460px] w-[280px] xl:w-auto">
              <Image
                src={game.image}
                alt={game.title}
                layout="fill"
                objectFit="cover"
                className="rounded-t-2xl"
              />
              <span
                className={`absolute top-3 left-3 text-white px-2 py-1 rounded text-xs font-medium ${game.tagColor}`}
              >
                {game.tag}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">{game.title}</h3>
              <p className="text-sm text-gray-600">{game.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
