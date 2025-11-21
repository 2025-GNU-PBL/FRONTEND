// 예: src/pages/views/WebView.tsx
import React from "react";
import { Icon } from "@iconify/react";

const WebView: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 리뷰 제출 로직 연결
    console.log("웹 리뷰 제출");
  };

  return (
    <div className="min-h-screen flex justify-center py-10">
      <div className="w-full max-w-3xl px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">리뷰 작성</h1>
          <p className="mt-2 text-sm text-gray-500">
            서비스 이용 경험을 다른 사용자들과 공유해주세요.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="리뷰 제목을 입력해주세요."
            />
          </div>

          {/* 별점 */}
          <div>
            <label className="block text-sm font-medium mb-1">평점</label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className="p-1"
                  // TODO: 선택 시 상태 관리 (useState) 및 색 변경
                >
                  <Icon icon="mdi:star" className="w-7 h-7 text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium mb-1">내용</label>
            <textarea
              className="w-full min-h-[200px] rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
              placeholder="서비스에 대한 상세한 후기를 작성해주세요."
            />
          </div>

          {/* 옵션: 공개 여부 / 닉네임 등 나중에 추가 가능 */}
          {/* <div>...</div> */}

          {/* 제출 버튼 */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white"
            >
              리뷰 등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebView;
