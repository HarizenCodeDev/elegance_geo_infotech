import React, { useState } from "react";
import axios from "axios";
import bgVideo from "../assets/Logo/galvid.mp4";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);
        try {
            await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
            setMessage("Request sent to manager/root account user. Please wait for assistance.");
        } catch (error) {
            setError(error.response?.data?.error || "Failed to send request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute w-full h-full object-cover"
            >
                <source src={bgVideo} type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-black/40"></div>

            <div className="relative flex flex-col items-center justify-center h-full space-y-6 px-4">
                
                <h2 className="font-Aguafina text-3xl text-white font-bold text-center">Elegance Geo Infotech</h2>

                <div className="bg-black/10 backdrop-blur-md shadow-xl rounded-lg p-8 w-full max-w-md border border-gray-900">
                    
                    <h4 className="text-xl text-white font-semibold text-center mb-4">Forgot Password</h4>
                    {message && <p className="text-green-500 text-center mb-4">{message}</p>}
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Request"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
