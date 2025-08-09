// import React from "react";
// import { useState, useContext } from "react";
// import withAuth from "../utils/withAuth";
// import { useNavigate } from "react-router-dom";
// import { IconButton, TextField } from "@mui/material";
// import RestoreIcon from "@mui/icons-material/Restore";
// import Button from "@mui/material/Button";
// import { AuthContext } from "../context/AuthContext";

// const Home = () => {
//   let navigate = useNavigate();
//   const [meetingCode, setMeetingCode] = useState("");

//   const { addToUserHistory } = useContext(AuthContext);
//   let handleJoinVideoCall = async () => {
//     await addToUserHistory(meetingCode);
//     navigate(`/${meetingCode}`);
//   };
//   return (
//     <>
//       <div className="flex text-center items-center justify-between pr-5">
//         <div style={{ display: "flex", alignItems: "center" }}>
//           <h1 className="text-3xl font-bold">SyncUp</h1>
//         </div>
//         <div style={{ display: "flex", alignItems: "center" }}>
//           <IconButton onClick={() => navigate("/history")}>
//             <RestoreIcon />
//           </IconButton>
//           <p>History</p>
//           <Button
//             onClick={() => {
//               localStorage.removeItem("token");
//               navigate("/auth");
//             }}
//           >
//             Logout
//           </Button>
//         </div>
//       </div>

//       <div className="flex px-5 h-[80vh] gap-[10vw] justify-center ">
//         <div className="h-full flex items-center">
//           <div>
//             <h2>Meetings</h2>
//             <div className="flex gap-2.5">
//               <TextField
//                 onChange={(e) => setMeetingCode(e.target.value)}
//                 id="out1"
//                 placeholder="Enter Meeting Code"
//               />
//               <Button onClick={handleJoinVideoCall} variant="contained">
//                 Join
//               </Button>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center"></div>
//       </div>
//     </>
//   );
// };

// export default withAuth(Home);

import React, { useState, useContext, useEffect } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../context/AuthContext";
import { Video, Lock, History, ArrowRight } from "lucide-react";

// Floating animation wrapper
const FloatingCard = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transform transition-all duration-1000 ease-out 
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} 
        ${className}`}
    >
      {children}
    </div>
  );
};

// Gradient button component
const GradientButton = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25",
    secondary:
      "bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white border border-green-500/20",
    outline:
      "border-2 border-green-500/50 hover:border-green-400 hover:bg-green-500/10 text-green-400",
  };

  return (
    <button
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group ${variants[variant]} ${className}`}
      {...props}
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
        transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
        transition-transform duration-1000"
      />
      <span className="relative flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

// Background effects for consistency
const BackgroundEffects = () => (
  <>
    <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-gradient-radial from-green-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
    <div
      className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-gradient-radial from-emerald-500/15 to-transparent rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "2s" }}
    />
    <div
      className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] 
      bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
    />
  </>
);

const Home = () => {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden relative">
      <BackgroundEffects />

      {/* Navbar */}
      <nav className="relative z-50 backdrop-blur-xl bg-black/20 border-b border-green-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <FloatingCard>
            <div className="flex items-center space-x-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mt-2">
                {/* <Video className="w-6 h-6 text-white" /> */}
                <img
                  src="./src/assets/Logo.png"
                  alt="SyncUp Logo"
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>

              <h1
                className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 
                               bg-clip-text text-transparent"
              >
                SyncUp
              </h1>
            </div>
          </FloatingCard>

          <div className="flex items-center gap-4">
            <FloatingCard delay={200}>
              <GradientButton
                variant="outline"
                onClick={() => navigate("/history")}
              >
                <History className="w-4 h-4" /> HISTORY
              </GradientButton>
            </FloatingCard>
            <FloatingCard delay={400}>
              <GradientButton
                variant="secondary"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/auth");
                }}
              >
                <Lock className="w-4 h-4" /> LOGOUT
              </GradientButton>
            </FloatingCard>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20">
        <FloatingCard delay={600}>
          <h2 className="text-4xl font-bold mb-8 text-center">
            Join a{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Meeting
            </span>
          </h2>
        </FloatingCard>

        <FloatingCard delay={800}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <TextField
              variant="outlined"
              placeholder="Enter Meeting Code"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              className="bg-white/5 rounded-lg"
              InputProps={{
                style: { color: "white" },
              }}
            />
            <GradientButton onClick={handleJoinVideoCall}>
              JOIN <ArrowRight className="w-4 h-4" />
            </GradientButton>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
};

export default withAuth(Home);
