import { useState } from "react";

const MobileView = () => {
  // 예시: 기존 값 프리필
  const [form, setForm] = useState({
    name: "무선 이어폰",
    code: "A1001",
    price: "59000",
    desc: "저지연, 장시간 배터리",
    status: "판매중",
  });
  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">상품 수정</h1>
      <form className="space-y-3">
        <input
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="상품명"
        />
        <input
          value={form.code}
          onChange={(e) => onChange("code", e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="상품 코드"
        />
        <input
          value={form.price}
          onChange={(e) => onChange("price", e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="가격"
          type="number"
        />
        <select
          value={form.status}
          onChange={(e) => onChange("status", e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        >
          <option>판매중</option>
          <option>품절</option>
          <option>일시중지</option>
        </select>
        <textarea
          value={form.desc}
          onChange={(e) => onChange("desc", e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="설명"
          rows={4}
        />
        <div className="flex gap-2">
          <button type="button" className="flex-1 rounded-xl border px-3 py-2">
            취소
          </button>
          <button type="button" className="flex-1 rounded-xl border px-3 py-2">
            저장
          </button>
        </div>
      </form>
    </div>
  );
};

export default MobileView;
