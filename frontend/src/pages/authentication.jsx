import * as React from "react";
import { AuthContext } from "../context/AuthContext";
import Snackbar from "@mui/material/Snackbar";
import { Lock, Mail, User, ArrowRight, Shield } from "lucide-react";

// Floating Card Component
const FloatingCard = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
      transform transition-all duration-1000 ease-out
      ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
      ${className}
    `}
    >
      {children}
    </div>
  );
};

// Gradient Button Component
const GradientButton = ({
  children,
  className = "",
  variant = "primary",
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
      className={`
        px-8 py-4 rounded-xl font-semibold transition-all duration-300 
        transform hover:scale-105 hover:shadow-xl active:scale-95
        relative overflow-hidden group w-full flex items-center justify-center gap-2
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                      transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                      transition-transform duration-1000"
      />
      <span className="relative flex items-center justify-center gap-2 w-full">
        {children}
      </span>
    </button>
  );
};

// Background Effects Component
const BackgroundEffects = () => (
  <>
    {/* Gradient Orbs */}
    <div
      className="absolute top-1/4 -right-1/4 w-96 h-96 bg-gradient-radial from-green-500/20 to-transparent 
                    rounded-full blur-3xl animate-pulse"
    />
    <div
      className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-gradient-radial from-emerald-500/15 to-transparent 
                    rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "2s" }}
    />

    {/* Grid Pattern */}
    <div
      className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] 
                    bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
    />

    {/* Floating Particles */}
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 bg-green-400/30 rounded-full animate-bounce"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 2}s`,
        }}
      />
    ))}
  </>
);

export default function Authentication() {
  const [username, setUsername] = React.useState();
  const [password, setPassword] = React.useState();
  const [Name, setName] = React.useState();
  const [error, seterror] = React.useState();
  const [messages, setMessages] = React.useState();

  const [formState, setFormState] = React.useState(0);

  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState();

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(Name, username, email, password);
        setMessages(result);
        setOpen(true);
        seterror("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        seterror(err.response.data.message);
      } else {
        seterror("Authentication failed. Please check your credentials.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden relative flex items-center justify-center">
      <BackgroundEffects />

      <div className="relative z-10 w-full max-w-md px-6">
        <FloatingCard delay={200}>
          <div
            className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/60 
                          border border-green-500/20 backdrop-blur-xl hover:border-green-400/40 
                          transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl" />
            <div className="relative">
              {/* Header */}
              <div className="flex flex-col items-center mb-8">
                <div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 
                                flex items-center justify-center mb-4 shadow-lg shadow-green-500/25 transform hover:scale-110 transition-transform duration-300"
                >
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                  {formState === 0 ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-400 mt-0 text-center text-sm px-4">
                  {formState === 0
                    ? "Enter your credentials to access your account"
                    : "Sign up to start hosting secure video meetings"}
                </p>
              </div>

              {/* Toggle Buttons */}
              <div className="flex bg-gray-900/50 p-1 rounded-xl mb-8 border border-green-500/10">
                <button
                  onClick={() => setFormState(0)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    formState === 0
                      ? "bg-green-500/20 text-green-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setFormState(1)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    formState === 1
                      ? "bg-green-500/20 text-green-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form Elements */}
              <div className="space-y-4">
                {formState === 1 && (
                  <>
                    {/* Full Name Input */}
                    {/* <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={Name || ""}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 
                                 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 
                                 focus:ring-1 focus:ring-green-500/50 transition-all"
                        placeholder="Full Name"
                      />
                    </div> */}

                    {/* Email Input */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email || ""}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 
                                 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 
                                 focus:ring-1 focus:ring-green-500/50 transition-all"
                        placeholder="Email Address"
                      />
                    </div>
                  </>
                )}

                {/* Username Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username || ""}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 
                             text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 
                             focus:ring-1 focus:ring-green-500/50 transition-all"
                    placeholder="Username"
                  />
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password || ""}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl py-3.5 pl-12 pr-4 
                             text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 
                             focus:ring-1 focus:ring-green-500/50 transition-all"
                    placeholder="Password"
                  />
                </div>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <div className="mt-0.5">
                    <Shield className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-red-400 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-8">
                <GradientButton onClick={handleAuth} className="w-full">
                  {formState === 0 ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </div>
            </div>
          </div>
        </FloatingCard>
      </div>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        message={messages}
      />
    </div>
  );
}
