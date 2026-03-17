import React, { useState } from "react";
import axios from "axios";
import bgVideo from "../assets/Logo/galvid.mp4";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ChangePassword = () => {
    const [email, setEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("token"); // Assuming JWT is stored in localStorage
        if (!token) {
            setError("You must be logged in to change password.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.put("http://localhost:5000/api/auth/change-password", {
                oldPassword,
                newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Password changed:", response.data);
            setSuccess("Password changed successfully!");
            // Clear form
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Change password failed:", error);
            setError(error.response?.data?.error || "Failed to change password.");
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

            <div className="relative flex flex-col items-center justify-center h-full space-y-6">
                <h2 className="font-Aguafina text-3xl text-white font-bold">Elegance Geo Infotech</h2>
                <div className="bg-black/900 backdrop-blur-md shadow-xl rounded-lg p-8 w-200 border border-black-100">
                    <h4 className="text-xl text-white font-semibold text-center mb-4">Change Password</h4>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-center mb-4">{success}</p>}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1 text-white">Email</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1 text-white">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    placeholder="Enter current password"
                                    value={oldPassword}
                                    className="border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                >
                                    {showOldPassword ? (
                                        <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1 text-white">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    className="border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1 text-white">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    className="border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition disabled:opacity-50"
                        >
                            {loading ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;