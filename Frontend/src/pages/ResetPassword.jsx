import React, { useState } from "react";
import axios from "axios";
import bgVideo from "/galvid.mp4";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("token"); // "token" or "password"

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage("Reset token generated. Check server console (prod: email sent to admin). Use token below.");
    } catch (err) {
      setError(err.response?.data?.error || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", { email, token, newPassword });
      setMessage("Password reset successfully! You can now login.");
      setStep("token");
      setToken("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed - check token/email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover">
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative flex flex-col items-center justify-center h-full space-y-6 px-4">
        <h2 className="font-Aguafina text-3xl text-white font-bold text-center">Reset Password</h2>
        <div className="bg-black/10 backdrop-blur-md shadow-xl rounded-lg p-8 w-full max-w-md border border-gray-900">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {message && <p className="text-green-500 text-center mb-4">{message}</p>}
          
          {step === "token" ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 text-white block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-white placeholder-gray-400"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button disabled={loading} className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 disabled:opacity-50">
                {loading ? "Sending..." : "Request Reset Token"}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Token will appear in server console (prod: emailed)
              </p>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 text-white block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-white placeholder-gray-400"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 text-white block">Reset Token</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-white placeholder-gray-400"
                  placeholder="paste token from console/email"
                  required
                />
              </div>
              <div className="relative">
                <label className="text-sm font-medium mb-1 text-white block">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border rounded w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-white placeholder-gray-400"
                  placeholder="new secure password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" /> : <AiOutlineEye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              <button disabled={loading} className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

