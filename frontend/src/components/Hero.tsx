import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-myGradient text-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Lootamo — Best deals on game keys, subscriptions & more
            </h1>
            <p className="mt-4 text-lg md:max-w-xl">
              Discover discounted keys, secure purchases and instant delivery. Join Lootamo and start saving on your favorite titles.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/deals" className="inline-block bg-white text-indigo-700 px-5 py-3 rounded-md font-semibold shadow">Shop Deals</Link>
              <Link href="/lootamo-plus" className="inline-block border border-white px-5 py-3 rounded-md">Lootamo Plus</Link>
            </div>

            <div className="mt-6">
              <form className="bg-white/10 rounded-md p-3 flex items-center gap-2 md:max-w-xl">
                <input aria-label="Quick search" className="flex-1 w-[200px] sm:w-auto bg-transparent outline-none placeholder-white text-white" placeholder="Search games, e.g. Elden Ring" />
                <button className="bg-white/20 px-4 py-2 rounded">Search</button>
              </form>
            </div>
          </div>

          <div className="flex-1 w-full hidden lg:block">
            <div className="relative h-64 lg:h-80 rounded-lg overflow-hidden shadow-lg">
              <Image src="/images/heroBg3.jpg" alt="Lootamo deals" fill style={{ objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
