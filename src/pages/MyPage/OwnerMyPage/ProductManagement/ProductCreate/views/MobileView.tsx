import { useState } from "react";

const MobileView = () => {
  const [form, setForm] = useState({ name: "", code: "", price: "", desc: "" });
  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">상품 추가</h1>
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
        <textarea
          value={form.desc}
          onChange={(e) => onChange("desc", e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="설명"
          rows={4}
        />
        <button type="button" className="w-full rounded-xl border px-3 py-2">
          저장
        </button>
      </form>
    </div>
  );
};

export default MobileView;
