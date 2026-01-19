import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<div style={{padding: '40px'}}>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
