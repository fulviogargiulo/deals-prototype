import { Search, ContactRound, Building, UsersRound, ChevronRight, Handshake, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useCurrentUser, USERS, type AppUser } from "@/contexts/UserContext";

const navItems = [
  { title: "Opportunities", url: "/", icon: Search },
  { title: "Deals", url: "/deals", icon: Handshake },
  { title: "Clients", url: "/clients", icon: ContactRound },
  { title: "Properties", url: "/properties", icon: Building, hasSubmenu: true },
  { title: "Agents", url: "/agents", icon: UsersRound },
];

function UserSwitcher() {
  const { currentUser, setCurrentUser } = useCurrentUser();
  return (
    <div className="px-4 py-3 border-t border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-2">Logged in as</p>
      <div className="relative group">
        <select
          value={currentUser.id}
          onChange={(e) => {
            const user = USERS.find((u) => u.id === e.target.value);
            if (user) setCurrentUser(user);
          }}
          className="w-full appearance-none px-3 py-2 pr-7 border border-border rounded-md text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          {USERS.map((u: AppUser) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/60">
        Role: <span className={`font-semibold ${currentUser.role === "finance_lead" ? "text-amber-600" : "text-muted-foreground"}`}>
          {currentUser.role === "finance_lead" ? "Finance Lead" : "Ops"}
        </span>
      </p>
    </div>
  );
}

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
      <UserSwitcher />
    </aside>
  );
}
