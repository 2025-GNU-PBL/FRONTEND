import axios from "./axios";

export const getUnreadNotificationCount = async () => {
  const response = await axios.get("/api/v1/notification/unread/count");
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number) => {
  const response = await axios.patch(
    `/api/v1/notification/${notificationId}/read`
  );
  return response.data;
};
