import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Deals from "./pages/Deals";
import DealDetail from "./pages/DealDetail";
import InvoiceDetail from "./pages/InvoiceDetail";
import Clients from "./pages/Clients";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <UserProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full overflow-hidden">
          <AppSidebar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:dealId" element={<DealDetail />} />
            <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:agentId" element={<AgentDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </UserProvider>
);

export default App;
