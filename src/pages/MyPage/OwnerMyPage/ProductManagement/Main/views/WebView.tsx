import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

const WebView = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-12 w-full max-w-3xl text-center">
        <h1 className="text-2xl font-bold mb-10">상품 관리 페이지</h1>
        <div className="flex justify-center gap-8">
          <button
            onClick={() => navigate("/my-page/owner/product/create")}
            className="flex items-center gap-2 bg-[#FF2233] text-white px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition"
          >
            <Icon icon="mdi:plus-box-outline" className="w-6 h-6" />
            상품 추가
          </button>
          <button
            onClick={() => navigate("/my-page/owner/product/edit")}
            className="flex items-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition"
          >
            <Icon icon="mdi:pencil-outline" className="w-6 h-6" />
            상품 수정
          </button>
          <button
            onClick={() => navigate("/my-page/owner/product/list")}
            className="flex items-center gap-2 bg-gray-300 text-gray-800 px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition"
          >
            <Icon icon="mdi:format-list-bulleted" className="w-6 h-6" />
            상품 조회
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebView;
