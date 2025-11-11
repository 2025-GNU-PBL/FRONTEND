import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { Product } from "../type/product";

/* ========================= 애니메이션 ========================= */

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

/* ========================= 유틸 ========================= */

const formatPrice = (price: number | string) => {
  const num =
    typeof price === "number"
      ? price
      : Number(String(price).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(num)) return String(price);
  return `${num.toLocaleString("ko-KR")}원`;
};

const getThumb = (p: Product) => p.thumbnail || "/images/placeholder.jpg";

/* ========================= 타입 ========================= */

export type WeddingHallCardProps = {
  product: Product;
  liked: boolean;
  onToggleLike: (id: number) => void;
  onClick?: () => void;
};

const ProductCard: React.FC<WeddingHallCardProps> = ({
  product,
  liked,
  onToggleLike,
  onClick,
}) => {
  return (
    <motion.div
      className="relative w-full flex flex-col gap-2"
      variants={fadeUp}
      whileHover={{ y: -2 }}
      onClick={onClick}
    >
      <div className="relative w-full aspect-[176/170] rounded-lg border border-[#F5F5F5] overflow-hidden">
        <img
          src={getThumb(product)}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <motion.button
          type="button"
          aria-label={liked ? "찜 해제" : "찜하기"}
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            onToggleLike(product.id);
          }}
          className="absolute right-2 top-2 grid place-items-center w-[8%] aspect-square"
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            key={liked ? "liked" : "unliked"}
            initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] w-full h-full"
          >
            <Icon
              icon={liked ? "solar:heart-bold" : "solar:heart-linear"}
              className={`w-full h-full ${
                liked ? "text-red-500" : "text-white"
              }`}
            />
          </motion.span>
        </motion.button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
          {product.ownerName}
        </p>
        <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-black line-clamp-2">
          {product.name}
        </p>
        <div className="mt-1 flex items-center gap-1">
          <img
            src="/images/star2.png"
            alt="평점"
            className="h-3 inline-block mb-[2px]"
            loading="lazy"
          />
          <span className="text-[12px] text-[#595F63]">
            {Number(product.starCount || 0).toFixed(1)}
          </span>
        </div>
        <p className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-black">
          {formatPrice(product.price)}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
