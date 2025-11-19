import api from "./axios";

export const multipartApi = {
  // POST (생성)
  post: async <T>(url: string, data: FormData) => {
    const res = await api.post<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res;
  },

  // PUT (전체 수정)
  put: async <T>(url: string, data: FormData) => {
    const res = await api.put<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res;
  },

  // 상품 수정 화면에서 쓰는 메서드
  patch: async <T>(url: string, data: FormData) => {
    const res = await api.patch<T>(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res;
  },
};
