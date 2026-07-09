import { useEffect, useState } from "react";
import axios from "axios";
import { getSocket } from "../utills/socket"
import { baseUrl, getAuthToken } from "@/config";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${baseUrl.notification}/my-notifications`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = res.data?.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const socket = getSocket(userId);
    socket.on("new_notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("new_notification");
    };
  }, [userId]);

  const markAllRead = async () => {
    try {
      await axios.put(
        `${baseUrl.notification}/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await axios.put(
        `${baseUrl.notification}/mark-read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  return { notifications, unreadCount, markAllRead, markOneRead, fetchNotifications };
};