import api from "./axios";

export const multipartApi = {
  post: async <T>(url: string, data: FormData) => {
    const res = await api.post<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res;
  },
  put: async <T>(url: string, data: FormData) => {
    const res = await api.put<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res;
  },
};
