import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "@/src/layouts/DefaultLayout";
import HomeView from "@/src/views/home";
import Dashboard from "@/src/views/dashboard";
import CaptureView from "@/src/views/capture";
import DanmakuMgt from "@/src/views/management/DanmakuMgt";
import RoomsMgt from "@/src/views/management/RoomsMgt";
import RealtimeDanmakuView from "@/src/views/realtime-danmaku";
import NotFound from "@/src/views/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <HomeView /> },
      {
        path: "dashboard",
        children: [
          { index: true, element: <Dashboard /> },
          //   { path: "analytics", element: <DashboardAnalytics /> },
        ],
      },
      {
        path: "capture",
        children: [
          { index: true, element: <CaptureView /> },
          //   { path: "setting", element: <CaptureSetting /> },
        ],
      },
      {
        path: "management",
        children: [
          { index: true, element: <DanmakuMgt /> },
          { path: "rooms", element: <RoomsMgt /> },
        ],
      },
      {
        path: "realtime-danmaku",
        children: [
          { index: true, element: <RealtimeDanmakuView /> },
          //   { path: "broadcast", element: <RealtimeBroadcast /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
