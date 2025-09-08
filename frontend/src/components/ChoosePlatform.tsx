import { FaWindows, FaXbox, FaPlaystation } from "react-icons/fa";
import { SiNintendoswitch } from "react-icons/si";
import Bestsellers from "./Bestsellers";

export default function ChoosePlatform() {
  const platforms = [
    {
      name: "PC",
      icon: <FaWindows className="w-6 h-6" />,
      href: "/gaming/pc"
    },
    {
      name: "Xbox",
      icon: <FaXbox className="w-6 h-6" />, 
      href: "/gaming/xbox"
    },
    {
      name: "Playstation",
      icon: <FaPlaystation className="w-6 h-6" />,
      href: "/gaming/playstation"
    },
    {
      name: "Nintendo",
      icon: <SiNintendoswitch className="w-6 h-6" />,
      href: "/gaming/nintendo"
    }
  ];

  return (
    <>
    <section className="relative flex w-full justify-center">
        <div className="relative flex flex-col w-full max-w-[1170px] text-left">
          <div className="flex items-center gap-24 py-6">
            <p className="text-[26px] leading-[38px] font-bold hidden lg:block shrink-0">
              Choose your platform
            </p>
            <ul className="flex items-center mx-auto gap-2 lg:gap-8 px-4 lg:px-0">
              {platforms.map((platform) => (
                <li key={platform.name} className="list-none">
                  <a
                    href={platform.href}
                    className="px-3 py-2 rounded flex items-center gap-2 text-[#212121] text-[14px] font-normal leading-[24px] hover:bg-[#F5F5F5] no-underline"
                  >
                    {platform.icon}
                    <p>{platform.name}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="w-full flex justify-center">
        <div className="w-full max-w-[1170px] px-4">
          <nav className="py-3">
            <ul className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar">
              <li>
                <a href="#bestsellers" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Bestsellers</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Random Keys</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Upcoming games</a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-sm text-gray-800 hover:text-black whitespace-nowrap">
                  <img
                    src="https://images.g2a.com/uiadminimages/41x41/1x1x1/c61a2f4c4ceb/95b706d262e84ddf9a69020f"
                    alt="Back to School"
                    className="w-5 h-5 rounded"
                  />
                  Back to School
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Trending categories</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Software</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Most popular game keys</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-800 hover:text-black whitespace-nowrap">Game Accounts</a>
              </li>
            </ul>
          </nav>
        </div>
      </section>

      <Bestsellers/>
    </>
  );
}