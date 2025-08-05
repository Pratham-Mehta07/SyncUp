import React, { useState, useEffect } from "react";

import "../index.css";
import {
  Video,
  Shield,
  Users,
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  Globe,
  Lock,
} from "lucide-react";

// Shimmer Loading Component (Inspired by Next.js)
const Shimmer = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent ${className}`}
  />
);

// Floating Card Component (Inspired by Aceternity UI)
const FloatingCard = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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

// Gradient Button Component (Inspired by shadcn/ui)
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
        relative overflow-hidden group
        ${variants[variant]} ${className}
      `}
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

// Feature Card Component (Material UI inspired)
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <FloatingCard delay={delay} className="group">
    <div
      className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/60 
                    border border-green-500/20 backdrop-blur-xl hover:border-green-400/40 
                    transition-all duration-300 hover:transform hover:scale-105"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl" />
      <div className="relative">
        <div
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 
                        flex items-center justify-center mb-4 group-hover:scale-110 
                        transition-transform duration-300"
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  </FloatingCard>
);

// Stats Component (Daisy UI inspired)
const StatsCard = ({ number, label, delay = 0 }) => (
  <FloatingCard delay={delay}>
    <div className="text-center p-4">
      <div
        className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 
                      bg-clip-text text-transparent mb-2"
      >
        {number}
      </div>
      <div className="text-gray-400 text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  </FloatingCard>
);

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

const SyncUpLanding = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      icon: Video,
      title: "Crystal Clear Video",
      description:
        "4K video quality with advanced noise cancellation and real-time optimization.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "End-to-end encryption with enterprise-grade security protocols and compliance.",
    },
    {
      icon: Users,
      title: "Unlimited Participants",
      description:
        "Host meetings with unlimited participants without compromising on quality.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden relative">
      <BackgroundEffects />

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-black/20 border-b border-green-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <FloatingCard>
              <div className="flex items-center space-x-2">
                <div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 
                                flex items-center justify-center"
                >
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h1
                  className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 
                               bg-clip-text text-transparent"
                >
                  SyncUp
                </h1>
              </div>
            </FloatingCard>

            <FloatingCard delay={200}>
              <GradientButton
                variant="outline"
                className="text-sm"
                onClick={() => (window.location.href = "/auth")}
              >
                <Lock className="w-4 h-4" />
                LOGIN
              </GradientButton>
            </FloatingCard>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* <FloatingCard delay={400}>
              <div
                className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 
                              border border-green-500/20 text-green-400 text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Now with AI-powered features
              </div>
            </FloatingCard> */}

            <FloatingCard delay={600}>
              <div className="space-y-4">
                <h2 className="text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="text-white">Seamless</span>
                  <br />
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    Professional
                  </span>
                  <br />
                  <span className="text-gray-300">Conferencing</span>
                </h2>
              </div>
            </FloatingCard>

            <FloatingCard delay={800}>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Crystal clear video, robust features, and enterprise-grade
                security for teams of all sizes. Experience the future of remote
                collaboration.
              </p>
            </FloatingCard>

            <FloatingCard delay={1000}>
              <div className="flex flex-col sm:flex-row gap-4">
                <GradientButton className="w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  START FREE MEETING
                  <ArrowRight className="w-5 h-5" />
                </GradientButton>

                <GradientButton
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => (window.location.href = "/join")}
                >
                  <Globe className="w-5 h-5" />
                  JOIN MEETING
                </GradientButton>
              </div>
            </FloatingCard>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={800 + index * 200} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent 
                      via-green-500/50 to-transparent"
      />
    </div>
  );
};

export default SyncUpLanding;
