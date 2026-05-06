import { Search, ContactRound, Building, UsersRound, ChevronRight, Handshake } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Opportunities", url: "/", icon: Search },
  { title: "Deals", url: "/deals", icon: Handshake },
  { title: "Clients", url: "/clients", icon: ContactRound },
  { title: "Properties", url: "/properties", icon: Building, hasSubmenu: true },
  { title: "Agents", url: "/agents", icon: UsersRound },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-[240px] min-w-[240px] min-h-screen border-r border-border flex flex-col bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px]">
        <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center shrink-0">
          <span className="font-bold text-base text-primary-foreground">K</span>
        </div>
        <span className="text-[16px] text-foreground tracking-tight">
          Huspy<span className="text-[8px] align-super">™</span>{" "}
          <span className="font-bold">Karvel</span>
        </span>
      </div>

      <nav className="flex-1 px-4 pt-2">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3 px-3 py-3 rounded-none text-[15px] text-muted-foreground hover:bg-accent transition-colors"
                  activeClassName="bg-accent text-foreground font-medium"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? "bg-foreground" : "bg-accent"
                    }`}
                  >
                    <item.icon
                      className={`h-[18px] w-[18px] ${
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <span className="flex-1">{item.title}</span>
                  {item.hasSubmenu && <ChevronRight className="h-4 w-4 opacity-40" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
