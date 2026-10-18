import Header from "@/components/layout/Header";
// import Footer from '@/components/layout/Footer'
import { Outlet } from "react-router-dom";
import AboutOverlay from "./components/layout/AboutOverlay";
import ScreenSizeNotice from "@/components/ScreenSizeNotice";
import useScreenBigEnough from "@/hooks/useScreenBigEnough";

function App() {
  const bigEnough = useScreenBigEnough();

  return (
    <>
      <Header levelsDisabled={!bigEnough} />
      {bigEnough ? <Outlet /> : <ScreenSizeNotice />}
      <AboutOverlay />
      {/* <Footer /> */}
    </>
  );
}

export default App;
