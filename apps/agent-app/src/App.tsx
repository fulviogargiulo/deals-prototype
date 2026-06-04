import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/theme-context";
import { LanguageProvider } from "./contexts/language-context";
import { DevToolsProvider, useDevTools } from "./contexts/dev-tools-context";
import { PageTitleProvider } from "./contexts/page-title-context";
import { MainLayout } from "./components/layout/main-layout";
import { SplashScreen } from "./components/ui/splash-screen";
import Home from "./pages/Home";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { ClientsList } from "./pages/clients/ClientsList";
import { ClientDetails } from "./pages/clients/ClientDetails";
import { OpportunitiesList } from "./pages/opportunities/OpportunitiesList";
import { OpportunityDetails } from "./pages/opportunities/OpportunityDetails";
import { PropertiesList } from "./pages/properties/PropertiesList";
import { MyPropertiesList } from "./pages/properties/MyPropertiesList";
import { MyPropertyDetails } from "./pages/properties/MyPropertyDetails";
import { PropertyDetails } from "./pages/properties/PropertyDetails";
import { TasksList } from "./pages/tasks/TasksList";
import { TaskDetails } from "./pages/tasks/TaskDetails";
import { DocumentsList } from "./pages/documents/DocumentsList";
import { Login } from "./pages/auth/Login";
import { DealsList } from "./pages/deals/DealsList";
import { DealDetails } from "./pages/deals/DealDetails";
import { PaymentHistory } from "./pages/deals/PaymentHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { showSplash, completeSplash } = useDevTools();
  // Splash screen is disabled by default - can be enabled via dev tools
  const [initialSplashShown, setInitialSplashShown] = useState(true);

  const handleSplashComplete = () => {
    sessionStorage.setItem("huspy-splash-shown", "true");
    setInitialSplashShown(true);
    completeSplash();
  };

  const shouldShowSplash = showSplash || !initialSplashShown;

  return (
    <>
      {shouldShowSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <PageTitleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/clients" element={<MainLayout><ClientsList /></MainLayout>} />
                <Route path="/clients/:id" element={<MainLayout><ClientDetails /></MainLayout>} />
                <Route path="/opportunities" element={<MainLayout><OpportunitiesList /></MainLayout>} />
                <Route path="/opportunities/:id" element={<MainLayout><OpportunityDetails /></MainLayout>} />
                <Route path="/deals" element={<MainLayout><DealsList /></MainLayout>} />
                <Route path="/deals/:id" element={<MainLayout><DealDetails /></MainLayout>} />
                <Route path="/income-details" element={<MainLayout><PaymentHistory /></MainLayout>} />
                <Route path="/properties" element={<MainLayout><PropertiesList /></MainLayout>} />
                <Route path="/my-properties" element={<MainLayout><MyPropertiesList /></MainLayout>} />
                <Route path="/my-properties/:id" element={<MainLayout><MyPropertyDetails /></MainLayout>} />
                <Route path="/properties/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
                <Route path="/tasks" element={<MainLayout><TasksList /></MainLayout>} />
                <Route path="/tasks/:id" element={<MainLayout><TaskDetails /></MainLayout>} />
                <Route path="/documents" element={<MainLayout><DocumentsList /></MainLayout>} />
                
                <Route path="/settings" element={<MainLayout><div className="p-6 animate-fade-in"><h1 className="text-3xl font-semibold">Settings</h1><p className="text-muted-foreground">Coming soon</p></div></MainLayout>} />
                <Route path="/help" element={<MainLayout><div className="p-6 animate-fade-in"><h1 className="text-3xl font-semibold">Help</h1><p className="text-muted-foreground">Coming soon</p></div></MainLayout>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PageTitleProvider>
      
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="huspy-ui-theme">
        <LanguageProvider>
          <DevToolsProvider>
            <AppContent />
          </DevToolsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
