import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

const MobileView = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-4">
      <h1 className="text-xl font-bold mb-8">상품 관리</h1>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => navigate("/my-page/owner/product/create")}
          className="flex items-center justify-center gap-2 bg-[#FF2233] text-white py-3 rounded-xl active:scale-95 transition"
        >
          <Icon icon="mdi:plus-box-outline" className="w-5 h-5" />
          상품 추가
        </button>
        <button
          onClick={() => navigate("/my-page/owner/product/edit")}
          className="flex items-center justify-center gap-2 bg-gray-700 text-white py-3 rounded-xl active:scale-95 transition"
        >
          <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
          상품 수정
        </button>
        <button
          onClick={() => navigate("/my-page/owner/product/list")}
          className="flex items-center justify-center gap-2 bg-gray-300 text-gray-800 py-3 rounded-xl active:scale-95 transition"
        >
          <Icon icon="mdi:format-list-bulleted" className="w-5 h-5" />
          상품 조회
        </button>
      </div>
    </div>
  );
};

export default MobileView;
