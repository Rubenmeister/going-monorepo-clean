import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import StartScreen from "@/components/StartScreen";
import TripSelection from "@/components/TripSelection";
import RegisterScreen from "@/components/RegisterScreen";
import ForgotPasswordScreen from "@/components/ForgotPasswordScreen";
import VerificationCodeScreen from "@/components/VerificationCodeScreen";
import ResetPasswordScreen from "@/components/ResetPasswordScreen";
import DriverRegisterScreen from "@/components/DriverRegisterScreen";
import DriverPendingScreen from "@/components/DriverPendingScreen";
import ToursScreen from "@/components/ToursScreen";
import ProfileScreen from "@/components/ProfileScreen";
import HostsScreen from "@/components/HostsScreen";
import DriverHomeScreen from "@/components/DriverHomeScreen";
import DriverStartScreen from "@/components/DriverStartScreen";
import DriverHelpScreen from "@/components/DriverHelpScreen";
import UserHelpScreen from "@/components/UserHelpScreen";
import AppLauncher from "@/components/AppLauncher";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [appMode, setAppMode] = useState<"user" | "driver">("user");
  const [currentScreen, setCurrentScreen] = useState<"launcher" | "splash" | "start" | "driver-start" | "register" | "driver-register" | "driver-pending" | "driver-home" | "driver-help" | "user-help" | "forgot-password" | "verification" | "reset-password" | "trip" | "tours" | "profile" | "hosts">("launcher");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const handleSplashComplete = () => {
    if (appMode === "user") {
      setCurrentScreen("start");
    } else {
      setCurrentScreen("driver-start");
    }
  };

  const handleLaunchUserApp = () => {
    setAppMode("user");
    setCurrentScreen("splash");
  };

  const handleLaunchDriverApp = () => {
    setAppMode("driver");
    setCurrentScreen("splash");
  };

  const handleHomeButton = () => {
    setCurrentScreen("launcher");
  };

  const handleStart = () => {
    setCurrentScreen("trip");
  };

  const handleRegister = () => {
    setCurrentScreen("register");
  };

  const handleDriverRegister = () => {
    setCurrentScreen("driver-register");
  };

  const handleDriverPending = () => {
    // For demo purposes, skip pending screen and go straight to driver home
    // In real app, this would go to pending, then home after approval
    setCurrentScreen("driver-home");
  };

  const handleDriverHome = () => {
    setCurrentScreen("driver-home");
  };

  const handleDriverHelp = () => {
    setCurrentScreen("driver-help");
  };

  const handleUserHelp = () => {
    setCurrentScreen("user-help");
  };

  const handleForgotPassword = () => {
    setCurrentScreen("forgot-password");
  };

  const handleCodeSent = (email: string) => {
    setRecoveryEmail(email);
    setCurrentScreen("verification");
  };

  const handleVerificationSuccess = () => {
    setCurrentScreen("reset-password");
  };

  const handleResetSuccess = () => {
    setCurrentScreen("start");
  };

  const handleBackToStart = () => {
    if (appMode === "user") {
      setCurrentScreen("start");
    } else {
      setCurrentScreen("driver-start");
    }
  };

  const handleBackToForgot = () => {
    setCurrentScreen("forgot-password");
  };

  const handleNavigate = (screen: string) => {
    if (screen === "tours") {
      setCurrentScreen("tours");
    } else if (screen === "profile") {
      setCurrentScreen("profile");
    } else if (screen === "hosts") {
      setCurrentScreen("hosts");
    } else if (screen === "help") {
      setCurrentScreen("user-help");
    }
  };

  const handleBackToTrip = () => {
    setCurrentScreen("trip");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground relative">
      
      {/* HOME BUTTON (Simulate Phone Home Button) */}
      {currentScreen !== "launcher" && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={handleHomeButton}
            className="w-32 h-1 bg-gray-300/50 rounded-full hover:bg-gray-400/80 transition-colors"
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentScreen === "launcher" && (
          <AppLauncher 
            key="launcher" 
            onLaunchUserApp={handleLaunchUserApp} 
            onLaunchDriverApp={handleLaunchDriverApp} 
          />
        )}
        {currentScreen === "splash" && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
        {currentScreen === "start" && (
          <StartScreen 
            key="start" 
            onStart={handleStart} 
            onRegister={handleRegister}
            onDriverRegister={handleDriverRegister}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {currentScreen === "driver-start" && (
          <DriverStartScreen 
            key="driver-start" 
            onLogin={handleDriverHome} 
            onRegister={handleDriverRegister}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {currentScreen === "register" && (
          <RegisterScreen 
            key="register" 
            onRegister={handleStart} 
            onBack={handleBackToStart}
          />
        )}
        {currentScreen === "driver-register" && (
          <DriverRegisterScreen 
            key="driver-register" 
            onRegister={handleDriverPending} 
            onBack={handleBackToStart}
          />
        )}
        {currentScreen === "driver-pending" && (
          <DriverPendingScreen 
            key="driver-pending"
            onBackToStart={handleBackToStart}
          />
        )}
        {currentScreen === "forgot-password" && (
          <ForgotPasswordScreen 
            key="forgot-password" 
            onBack={handleBackToStart}
            onCodeSent={handleCodeSent}
          />
        )}
        {currentScreen === "verification" && (
          <VerificationCodeScreen 
            key="verification"
            email={recoveryEmail}
            onVerify={handleVerificationSuccess}
            onBack={handleBackToForgot}
          />
        )}
        {currentScreen === "reset-password" && (
          <ResetPasswordScreen 
            key="reset-password"
            onResetSuccess={handleResetSuccess}
            onBack={handleBackToForgot}
          />
        )}
        {currentScreen === "trip" && (
          <TripSelection key="trip" onNavigate={handleNavigate} />
        )}
        {currentScreen === "tours" && (
          <ToursScreen key="tours" onBack={handleBackToTrip} />
        )}
        {currentScreen === "profile" && (
          <ProfileScreen key="profile" onBack={handleBackToTrip} />
        )}
        {currentScreen === "hosts" && (
          <HostsScreen key="hosts" onBack={handleBackToTrip} />
        )}
        {currentScreen === "driver-home" && (
          <DriverHomeScreen key="driver-home" onOpenMenu={handleDriverHelp} />
        )}
        {currentScreen === "driver-help" && (
          <DriverHelpScreen key="driver-help" onBack={handleDriverHome} />
        )}
        {currentScreen === "user-help" && (
          <UserHelpScreen key="user-help" onBack={handleBackToTrip} />
        )}
      </AnimatePresence>
    </div>
  );
}
