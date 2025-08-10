import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "../app/routes/layout";
import Home from "../app/routes/home";
import Thread from "../app/routes/thread";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "threads/:threadId",
        element: <Thread />,
      },
    ],
  },
]);

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
