import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{padding: '40px', fontSize: '24px'}}>Home Page Works!</div>} />
        <Route path="/test" element={<div style={{padding: '40px', fontSize: '24px'}}>Test Page Works!</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
