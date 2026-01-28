import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

const NotificationDropdown = ({ notifications, onMarkAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAsRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50/50" : ""
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div
                                                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.type === "success"
                                                            ? "bg-green-500"
                                                            : notification.type === "error"
                                                                ? "bg-red-500"
                                                                : "bg-blue-500"
                                                        }`}
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(notification.createdAt).toLocaleDateString()}{" "}
                                                        at {new Date(notification.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;
