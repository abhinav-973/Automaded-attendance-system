import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/ui/layout/Sidebar";
// import Navbar from "./components/ui/layout/Navbar"; // Removed to fix double-header

const MainLayout = ({ setAuthState }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-[#f0f2f5] md:h-screen">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        setAuthState={setAuthState}
      />

      {/* FIX 1: Added dynamic margin-left (md:ml-72 or md:ml-20) 
        This pushes the main content out from under the fixed Sidebar. 
      */}
      <div 
        className={`relative flex min-h-dvh flex-1 flex-col md:h-full transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:ml-20" : "md:ml-72"}
        `}
      >
        
        {/* FIX 2: Removed <Navbar /> completely. 
          Your new Dashboard handles the profile and bell icon in its dark hero section!
        */}

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;