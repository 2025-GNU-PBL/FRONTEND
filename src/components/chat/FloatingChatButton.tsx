import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

const FloatingChatButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/chat");
  };

  return (
    <button
      onClick={handleClick}
      className="
        fixed
        bottom-6
        right-6
        z-50
        w-16
        h-16
        rounded-full
        bg-gradient-to-br
        from-pink-500
        to-rose-400
        shadow-lg
        flex
        items-center
        justify-center
        text-white
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-2xl
        active:scale-95
      "
      aria-label="채팅 열기"
    >
      <Icon icon="solar:chat-round-line-duotone" width={28} height={28} />
    </button>
  );
};

export default FloatingChatButton;
