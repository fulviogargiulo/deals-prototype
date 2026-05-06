import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { DataProvider } from "./contexts/data-context.tsx";
import { ScheduleProvider } from "./contexts/schedule-context.tsx";

createRoot(document.getElementById("root")!).render(
  <DataProvider>
    <ScheduleProvider>
      <App />
    </ScheduleProvider>
  </DataProvider>
);
