import { useState } from "react";

const WebView = () => {
  const [form, setForm] = useState({
    name: "무선 이어폰",
    code: "A1001",
    price: "59000",
    desc: "저지연, 장시간 배터리",
    status: "판매중",
  });
  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="pt-16">
      <div className="mx-auto max-w-[920px] px-8 pb-16">
        <h1 className="text-2xl font-semibold mb-6">상품 수정</h1>

        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">상품명</label>
              <input
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">상품 코드</label>
              <input
                value={form.code}
                onChange={(e) => onChange("code", e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">가격</label>
              <input
                value={form.price}
                onChange={(e) => onChange("price", e.target.value)}
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">상태</label>
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              >
                <option>판매중</option>
                <option>품절</option>
                <option>일시중지</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">설명</label>
              <textarea
                value={form.desc}
                onChange={(e) => onChange("desc", e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="rounded-lg border px-4 py-2">취소</button>
            <button className="rounded-lg border px-4 py-2">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebView;
