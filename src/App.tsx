import Header from "@/components/layout/Header";
// import Footer from '@/components/layout/Footer'
import { Outlet } from "react-router-dom";
import AboutOverlay from "./components/layout/AboutOverlay";

function App() {
  return (
    <>
      <Header />
      <Outlet />
      <AboutOverlay />
      {/* <Footer /> */}
    </>
  );
}

export default App;
