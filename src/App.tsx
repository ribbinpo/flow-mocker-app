import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import FlowListPage from "@/pages/FlowListPage";
import FlowBuilderPage from "@/pages/FlowBuilderPage";
import { useFlowPersistence } from "@/hooks/useFlowPersistence";
import { useCatalogPersistence } from "@/hooks/useCatalogPersistence";

export function App() {
  useFlowPersistence();
  useCatalogPersistence();

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FlowListPage />} />
          <Route path="/flow/:flowId" element={<FlowBuilderPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
