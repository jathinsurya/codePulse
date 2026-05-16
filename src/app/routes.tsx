import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { LandingPage } from "./components/LandingPage";
import { ScanPage } from "./components/ScanPage";
import { DashboardPage } from "./components/DashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "scan", Component: ScanPage },
      { path: "dashboard", Component: DashboardPage },
    ],
  },
]);