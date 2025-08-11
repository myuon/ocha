import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "../app/routes/home";
import Layout, { loader as layoutLoader } from "../app/routes/layout";
import Thread, { loader as threadLoader } from "../app/routes/thread";
import { AuthProvider } from "./contexts/AuthContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    loader: layoutLoader,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "threads/:threadId",
        element: <Thread />,
        loader: threadLoader,
      },
    ],
  },
]);

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
