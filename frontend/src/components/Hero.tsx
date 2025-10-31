import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-myGradient text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Lootamo — Best deals on game keys, subscriptions & more
            </h1>
            <p className="mt-4 text-lg md:max-w-xl">
              Discover discounted keys, secure purchases and instant delivery. Join Lootamo and start saving on your favorite titles.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="inline-block bg-white text-indigo-700 px-5 py-3 rounded-md font-semibold shadow">Browse Games</Link>
              <Link href="/categories" className="inline-block border border-white px-5 py-3 rounded-md">Explore Categories</Link>
            </div>

            {/* <div className="mt-6">
              <form className="bg-white/10 rounded-md p-3 flex items-center gap-2 md:max-w-xl">
                <input aria-label="Quick search" className="flex-1 w-[200px] sm:w-auto bg-transparent outline-none placeholder-white text-white" placeholder="Search games, e.g. Elden Ring" />
                <button className="bg-white/20 px-4 py-2 rounded">Search</button>
              </form>
            </div> */}
          </div>

          <div className="flex-1 w-full hidden lg:block relative">
            {/* Floating Game Cards */}
            <div className="relative h-64 lg:h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-80 h-64 lg:w-96 lg:h-80">
                  {/* Main Featured Game */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500">
                    <div className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold inline-block mb-4">
                          🔥 TRENDING
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Cyberpunk 2077</h3>
                        <p className="text-sm opacity-90">Ultimate Edition</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-sm opacity-75 line-through">$59.99</div>
                          <div className="text-2xl font-bold">$29.99</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <span className="text-2xl">🎮</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card 1 */}
                  <div className="absolute -top-8 -right-8 w-32 h-40 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl transform -rotate-12 hover:-rotate-6 transition-transform duration-500 animate-float">
                    <div className="p-3 h-full flex flex-col justify-between text-xs">
                      <div className="bg-red-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                        -50%
                      </div>
                      <div>
                        <div className="font-bold">Elden Ring</div>
                        <div className="text-xl font-bold">$30</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card 2 */}
                  <div className="absolute -bottom-6 -left-6 w-28 h-36 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl transform rotate-12 hover:rotate-6 transition-transform duration-500 animate-float delay-1000">
                    <div className="p-3 h-full flex flex-col justify-between text-xs">
                      <div className="bg-blue-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                        NEW
                      </div>
                      <div>
                        <div className="font-bold">FIFA 24</div>
                        <div className="text-xl font-bold">$45</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card 3 */}
                  <div className="absolute top-16 -left-12 w-24 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-xl transform -rotate-6 hover:-rotate-12 transition-transform duration-500 animate-float delay-500">
                    <div className="p-2 h-full flex flex-col justify-between text-xs">
                      <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                        HOT
                      </div>
                      <div>
                        <div className="font-bold text-xs">GTA V</div>
                        <div className="text-lg font-bold">$15</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
