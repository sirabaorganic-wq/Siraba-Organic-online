import React, { useState } from "react";
import { Bell, Check, Package, AlertCircle, CheckCircle, Info, ExternalLink } from "lucide-react";

const NotificationDropdown = ({
  notifications = [],
  onMarkAsRead,
  onMarkOneRead,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  const handleItemClick = (notification) => {
    if (!notification.isRead && onMarkOneRead) {
      onMarkOneRead(notification._id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };

  const getIcon = (notification) => {
    const sev = notification.severity || notification.type;
    if (sev === "error" || sev === "critical") {
      return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    }
    if (sev === "success") {
      return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
    if (notification.category === "logistics") {
      return <Package className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
    return <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg hover:bg-secondary/10 transition-colors focus:outline-none"
        title="Vendor Notifications"
        aria-label="Vendor Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && onMarkAsRead && (
                <button
                  onClick={onMarkAsRead}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => {
                  const isUnread = !notification.isRead;
                  const awbCode = notification.metadata?.awbCode;
                  const orderNum = notification.metadata?.orderNumber;

                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleItemClick(notification)}
                      className={`p-4 transition-colors cursor-pointer group hover:bg-gray-50 flex items-start gap-3 ${
                        isUnread ? "bg-emerald-50/40" : "bg-white"
                      }`}
                    >
                      {getIcon(notification)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold truncate ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Metadata tags */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-gray-500">
                          {orderNum && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                              #{orderNum}
                            </span>
                          )}
                          {awbCode && (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                              AWB: {awbCode}
                            </span>
                          )}
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            &bull;{" "}
                            {new Date(notification.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Single Mark Read Button */}
                      {isUnread && onMarkOneRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkOneRead(notification._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-500 transition-opacity"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">Milestones for your orders will appear here.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications && notifications.length > 0 && (
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                <span className="text-[11px] text-gray-500">
                  Showing recent order & shipment updates
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
