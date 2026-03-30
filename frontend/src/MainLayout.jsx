import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/ui/layout/Sidebar";
import Navbar from "./components/ui/layout/Navbar";

const MainLayout = ({ setAuthState }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="shrink-0">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setAuthState={setAuthState}
        />
      </div>

      <div className="relative flex h-full flex-1 flex-col">
        <Navbar setAuthState={setAuthState} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
