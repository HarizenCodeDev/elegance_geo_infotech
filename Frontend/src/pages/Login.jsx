import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import bgVideo from "../assets/Logo/galvid.mp4";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useAuth } from "../context/authContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {login} = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      localStorage.setItem("token", response.data.token);
      const { user: userData } = response.data;

      login(userData);

      if (userData.role === "root") {
        navigate("/root-dashboard");
      } else if (userData.role === "admin" || userData.role === "manager") {
        navigate("/admin-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
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
        <h2 className="font-Aguafina text-3xl text-white font-bold text-center">Elegance Geo Infotech</h2>

        <div className="bg-black/10 backdrop-blur-md shadow-xl rounded-lg p-8 w-full max-w-md border border-gray-900">
          <h4 className="text-xl text-white font-semibold text-center mb-4">Login</h4>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-white">Email</label>
              <input
                type="email"
                placeholder="xxxx@gmail.com"
                value={email}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-white placeholder-gray-400"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-white">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="pwd******"
                  value={password}
                  className="border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full bg-transparent text-white placeholder-gray-400"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                  ) : (
                    <AiOutlineEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <Link to="/Forgot-Password" className="text-sm text-teal-400 hover:underline">
                Forgot Password?
              </Link>
              <Link to="/change-password" className="text-sm text-teal-400 hover:underline">
                Change Password
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
