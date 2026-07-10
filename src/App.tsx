import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppShell from "./components/AppShell";
import { ConfigProvider } from "./context/ConfigContext";
import ArenaPage from "./pages/arena/ArenaPage";
import HistoryPage from "./pages/history/HistoryPage";
import ResultsPage from "./pages/results/ResultsPage";
import SetupPage from "./pages/setup/SetupPage";

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <SetupPage /> },
      { path: "/debates", element: <HistoryPage /> },
      { path: "/debates/:debateId", element: <ArenaPage /> },
      { path: "/debates/:debateId/results", element: <ResultsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
