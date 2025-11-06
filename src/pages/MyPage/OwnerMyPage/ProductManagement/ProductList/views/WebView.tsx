import { useState } from "react";
import { Icon } from "@iconify/react";

type Product = { name: string; code: string; price: number; status: string };

const WebView = () => {
  const [query, setQuery] = useState("");
  const rows: Product[] = [
    { name: "무선 이어폰", code: "A1001", price: 59000, status: "판매중" },
    { name: "블루투스 스피커", code: "A1002", price: 89000, status: "품절" },
    { name: "USB C 케이블", code: "A1003", price: 12000, status: "판매중" },
    { name: "게이밍 마우스", code: "A1004", price: 49000, status: "판매중" },
  ].filter(
    (r) =>
      !query ||
      r.name.includes(query) ||
      r.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="pt-16">
      <div className="mx-auto max-w-[1120px] px-8 pb-16 space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-semibold">상품 조회</h1>
          <button className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
            <Icon icon="solar:plus-square-linear" className="w-4 h-4" />
            상품 추가
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Icon
              icon="solar:magnifer-linear"
              className="w-5 h-5 text-gray-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명/코드 검색"
              className="bg-transparent outline-none text-sm"
            />
          </div>
          <button className="rounded-xl border px-4 py-2 text-sm">필터</button>
        </div>

        <div className="overflow-auto rounded-2xl border">
          <table className="min-w-[760px] w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">상품명</th>
                <th className="px-4 py-3">코드</th>
                <th className="px-4 py-3">가격</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-t">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.code}</td>
                  <td className="px-4 py-3">₩{r.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg border px-3 py-1 mr-2 text-sm">
                      상세
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm">
                      수정
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WebView;
