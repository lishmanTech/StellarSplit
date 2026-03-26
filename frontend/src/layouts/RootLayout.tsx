import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
export default function RootLayout() {
  const { pathname } = useLocation();
  return (<>{pathname !== "/" && <Navbar />}<Outlet /></>);
}