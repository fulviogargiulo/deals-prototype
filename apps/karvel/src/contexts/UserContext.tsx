import { createContext, useContext, useState } from "react";

export type UserRole = "ops" | "finance_lead";

export interface AppUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
}

export const USERS: AppUser[] = [
  { id: "user-ops", name: "Sarah (Ops)", initials: "SO", role: "ops" },
  { id: "user-finance", name: "Marco (Finance Lead)", initials: "FL", role: "finance_lead" },
];

interface UserContextValue {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
}

const UserContext = createContext<UserContextValue>({
  currentUser: USERS[0],
  setCurrentUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser>(USERS[0]);
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}
