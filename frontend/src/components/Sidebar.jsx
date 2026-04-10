// import { Link, useLocation } from "react-router-dom";
// import {
//     LayoutDashboard,
//     Shield,
//     User,
//     LogOut,
//     Menu
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
// import { useState } from "react";

// const Sidebar = () => {
//     const { user, logout, isAdmin } = useAuth();
//     const location = useLocation();
//     const [open, setOpen] = useState(true);

//     const navItem = (to, Icon, label) => {
//         const active = location.pathname === to;

//         return (
//             <Link
//                 to={to}
//                 className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${active
//                     ? "bg-indigo-600 text-white"
//                     : "text-slate-400 hover:bg-white/10 hover:text-white"
//                     }`}
//             >
//                 <Icon className="w-4 h-4" />
//                 {open && label}
//             </Link>
//         );
//     };

//     return (
//         <div
//             className={`h-screen bg-[#0b0b14] border-r border-white/10 flex flex-col transition-all ${open ? "w-64" : "w-16"
//                 }`}
//         >
//             {/* Toggle */}
//             <div className="flex items-center justify-between p-4">
//                 {open && <h1 className="text-white font-semibold">SBOM</h1>}
//                 <button onClick={() => setOpen(!open)}>
//                     <Menu className="text-white w-5 h-5" />
//                 </button>
//             </div>

//             {/* User Info */}
//             <div className="px-4 py-3 border-t border-white/10 border-b border-white/10">
//                 <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
//                         {user?.name?.charAt(0).toUpperCase()}
//                     </div>
//                     {open && (
//                         <div>
//                             <p className="text-white text-sm">{user?.name}</p>
//                             <p className="text-xs text-slate-400 capitalize">
//                                 {user?.role}
//                             </p>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Navigation */}
//             <div className="flex-1 p-3 space-y-2">
//                 {navItem("/dashboard", LayoutDashboard, "Dashboard")}

//                 {/* Admin only */}
//                 {isAdmin() && navItem("/admin", Shield, "Admin Panel")}

//                 {navItem("/profile", User, "Profile")}
//             </div>

//             {/* Logout */}
//             <div className="p-3 border-t border-white/10">
//                 <button
//                     onClick={logout}
//                     className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
//                 >
//                     <LogOut className="w-4 h-4" />
//                     {open && "Logout"}
//                 </button>
//             </div>
//         </div>
//     );
// };


// export default Sidebar;




import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Shield,
    User,
    LogOut,
    Menu,
    Clock,
    CheckCircle,
    PlusCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Sidebar = () => {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(true);

    const navItem = (to, Icon, label) => {
        const active = location.pathname === to;

        return (
            <Link
                to={to}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${active
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
            >
                <Icon className="w-4 h-4" />
                {open && label}
            </Link>
        );
    };

    return (
        <div
            className={`h-screen bg-[#0b0b14] border-r border-white/10 flex flex-col transition-all ${open ? "w-64" : "w-16"
                }`}
        >
            {/* Toggle */}
            <div className="flex items-center justify-between p-4">
                {open && <h1 className="text-white font-semibold">SBOM</h1>}
                <button onClick={() => setOpen(!open)}>
                    <Menu className="text-white w-5 h-5" />
                </button>
            </div>

            {/* User Info */}
            <div className="px-4 py-3 border-t border-white/10 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {open && (
                        <div>
                            <p className="text-white text-sm">{user?.name}</p>
                            <p className="text-xs text-slate-400 capitalize">
                                {user?.role}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-3 space-y-2">

                {/* Dashboard */}
                {navItem("/dashboard", LayoutDashboard, "Dashboard")}

                {/* ===== SCANS SECTION ===== */}
                {open && (
                    <p className="text-xs text-slate-500 px-3 mt-4">
                        SCANS
                    </p>
                )}

                {navItem("/scans/active", Clock, "Active Scans")}
                {navItem("/scans/completed", CheckCircle, "Completed")}
                {navItem("/scans/new", PlusCircle, "New Scan")}

                {/* ===== ADMIN ===== */}
                {isAdmin() && (
                    <>
                        {open && (
                            <p className="text-xs text-slate-500 px-3 mt-4">
                                ADMIN
                            </p>
                        )}
                        {navItem("/admin", Shield, "Admin Panel")}
                    </>
                )}

                {/* Profile */}
                {navItem("/profile", User, "Profile")}
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                    <LogOut className="w-4 h-4" />
                    {open && "Logout"}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;