import { FaWindows, FaXbox, FaPlaystation } from "react-icons/fa";
import { SiNintendoswitch } from "react-icons/si";
import Bestsellers from "./Bestsellers";
import RandomKeys from "./RandomKeys";

export default function ChoosePlatform() {
  const platforms = [
    {
      name: "PC",
      icon: <FaWindows className="w-6 h-6" />,
      href: "/gaming/pc",
    },
    {
      name: "Xbox",
      icon: <FaXbox className="w-6 h-6" />,
      href: "/gaming/xbox",
    },
    {
      name: "Playstation",
      icon: <FaPlaystation className="w-6 h-6" />,
      href: "/gaming/playstation",
    },
    {
      name: "Nintendo",
      icon: <SiNintendoswitch className="w-6 h-6" />,
      href: "/gaming/nintendo",
    },
  ];

  const navItems = [
    { name: "Bestsellers", href: "#bestsellers" },
    { name: "Random Keys", href: "#random-keys" },
    { name: "Upcoming Games", href: "#upcoming" },
    {
      name: "Back to School",
      href: "#back-to-school",
      icon: "/images/fire-flame.jpg",
    },
    { name: "Trending Categories", href: "#trending" },
    { name: "Software", href: "#software" },
    { name: "Popular Game Keys", href: "#popular" },
    { name: "Game Accounts", href: "#accounts" },
  ];

  const handleScrollTo = (id: string) => (e: { preventDefault: () => void; }) => {
    e.preventDefault(); // prevent default anchor behavior
    const element = document.getElementById(id);
    if (element) {
      const yOffset = 170; // height of your sticky nav
      const y =
        element.getBoundingClientRect().top + window.pageYOffset - yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      <section className="relative flex w-full justify-center">
        <div className="relative flex flex-col w-full max-w-[1170px] text-left">
          <div className="flex items-center gap-8 lg:gap-24 py-6 px-6 flex-wrap">
            <p className="text-[26px] leading-[38px] font-bold shrink-0">
              Choose your platform
            </p>
            <ul className="flex items-center flex-wrap mx-auto gap-2 lg:gap-8">
              {platforms.map((platform) => (
                <li key={platform.name} className="list-none">
                  <a
                    href={platform.href}
                    className="px-3 py-2 rounded flex items-center gap-2 text-[#212121] text-[14px] font-normal leading-[24px] hover:bg-[#e4e4e4] no-underline transition-all duration-300"
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
      <section className="w-full overflow-x-auto max-w-[1200px] mx-auto flex bg-white border-b border-gray-200 sticky top-[70px] z-10 shadow-lg">
        <nav className="py-4 px-4 w-full">
          <div className="flex items-center scrollbar-hide w-full">
            <ul className="flex items-center justify-around gap-1 w-full">
              {navItems.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    onClick={handleScrollTo(item.href.replace("#", ""))}
                    className="group relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-all duration-200 whitespace-nowrap rounded-lg hover:bg-blue-50"
                  >
                    {item.icon && (
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-myGradient transition-all duration-300 group-hover:w-full group-hover:left-0"></div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </section>

      <section id="bestsellers">
        <Bestsellers />
      </section>
      <section id="random-keys">
        <RandomKeys />
      </section>
    </>
  );
}
