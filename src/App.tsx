import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import FlowListPage from "@/pages/FlowListPage";
import FlowBuilderPage from "@/pages/FlowBuilderPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FlowListPage />} />
        <Route path="/flow/:flowId" element={<FlowBuilderPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
