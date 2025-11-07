import { useState } from "react";
import { Icon } from "@iconify/react";

const MobileView = () => {
  const [query, setQuery] = useState("");

  const products = [
    { name: "무선 이어폰", code: "A1001", price: 59000, status: "판매중" },
    { name: "블루투스 스피커", code: "A1002", price: 89000, status: "품절" },
    { name: "USB C 케이블", code: "A1003", price: 12000, status: "판매중" },
  ].filter(
    (p) =>
      !query ||
      p.name.includes(query) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col text-black/80">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">상품 조회</h1>
      </header>

      <main className="px-4 pb-8 space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명/코드 검색"
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
          />
          <button className="rounded-xl border px-3 py-2 text-sm">검색</button>
        </div>

        <ul className="divide-y rounded-xl border">
          {products.map((p) => (
            <li key={p.code} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  ₩{p.price.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{p.status}</p>
              </div>
            </li>
          ))}
          {products.length === 0 && (
            <li className="p-4 text-sm text-gray-500">검색 결과가 없습니다.</li>
          )}
        </ul>

        <button className="mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <Icon icon="solar:plus-square-linear" className="w-4 h-4" />
          상품 추가
        </button>
      </main>
    </div>
  );
};

export default MobileView;
