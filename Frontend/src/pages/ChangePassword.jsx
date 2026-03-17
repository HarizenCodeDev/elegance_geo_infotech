import React, { useState } from "react";
import axios from "axios";
import bgVideo from "/galvid.mp4";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import PasswordInput from "../components/PasswordInput"; // Assuming you create this component

const ChangePassword = () => {
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
            await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/change-password`, {
                oldPassword,
                newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSuccess("Password changed successfully!");
            // Clear form
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword(""); 
        } catch (error) {
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
                        <PasswordInput
                            label="Current Password"
                            placeholder="Enter current password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            showPassword={showOldPassword}
                            onToggleShowPassword={() => setShowOldPassword(!showOldPassword)}
                        />
                        <PasswordInput
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            showPassword={showNewPassword}
                            onToggleShowPassword={() => setShowNewPassword(!showNewPassword)}
                        />
                        <PasswordInput
                            label="Confirm New Password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            showPassword={showConfirmPassword}
                            onToggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
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