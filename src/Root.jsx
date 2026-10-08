import { Suspense, lazy } from "react";
import App from "./App.jsx";

// The admin dashboard is a separate chunk: public visitors never download it.
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));

export default function Root() {
  if (!/^\/admin(\/|$)/.test(window.location.pathname)) return <App />;
  return <Suspense fallback={<div className="adm-loading">Loading…</div>}><AdminApp /></Suspense>;
}
