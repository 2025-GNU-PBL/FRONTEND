import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock } from "react-icons/fi";
import axiosInstance from "../../utils/axios";

// 카드 컨테이너(양 쪽 동일한 크기) 컴포넌트
const Card = ({ title, children }) => (
  <div className="flex-1 bg-white/90 rounded-2xl shadow-2xl border border-blue-100 p-8 flex flex-col items-center min-h-[440px] md:min-h-[520px]">
    <h1 className="text-xl sm:text-2xl font-extrabold text-blue-700 mb-8 select-none">
      {title}
    </h1>
    {children}
  </div>
);

// 사장님 로그인 폼
function OwnerLoginForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ mode: "onChange" });

  const onSubmit = async ({ id, password }) => {
    try {
      const response = await axiosInstance.post("/owner/login", {
        id,
        password,
      });
      localStorage.setItem("accessToken", response.data.accessToken);
      reset();
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data?.message || error.message);
      } else {
        console.error(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <div>
        <label
          htmlFor="ownerId"
          className="block text-sm font-semibold text-blue-700 mb-2"
        >
          사장님 ID
        </label>
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="ownerId"
            type="text"
            {...register("id", { required: "ID is required" })}
            className={`w-full pl-9 pr-4 py-2 border rounded-lg placeholder-gray-400 bg-blue-50/70 text-gray-700
              ${errors.id ? "border-red-400 ring-red-200" : "border-blue-100"}`}
            placeholder="사장님 ID"
            autoComplete="username"
          />
        </div>
        {errors.id && (
          <p className="text-xs text-red-500 mt-2">{errors.id.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="ownerPassword"
          className="block text-sm font-semibold text-blue-700 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="ownerPassword"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            className={`w-full pl-9 pr-4 py-2 border rounded-lg placeholder-gray-400 bg-blue-50/70 text-gray-700
              ${
                errors.password
                  ? "border-red-400 ring-red-200"
                  : "border-blue-100"
              }`}
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-2">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-green-500 via-blue-400 to-blue-400 text-white rounded-lg font-bold transition duration-300 shadow-lg"
      >
        사장님 로그인
      </button>
    </form>
  );
}

// 회원 로그인 폼
function MemberLoginForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ mode: "onChange" });

  const onSubmit = async ({ id, password }) => {
    try {
      const response = await axiosInstance.post("/admin/login", {
        id,
        password,
      });
      localStorage.setItem("accessToken", response.data.accessToken);
      reset();
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data?.message || error.message);
      } else {
        console.error(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <div>
        <label
          htmlFor="memberId"
          className="block text-sm font-semibold text-blue-700 mb-2"
        >
          회원 ID
        </label>
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="memberId"
            type="text"
            {...register("id", { required: "ID is required" })}
            className={`w-full pl-9 pr-4 py-2 border rounded-lg placeholder-gray-400 bg-blue-50/70 text-gray-700
              ${errors.id ? "border-red-400 ring-red-200" : "border-blue-100"}`}
            placeholder="회원 ID"
            autoComplete="username"
          />
        </div>
        {errors.id && (
          <p className="text-xs text-red-500 mt-2">{errors.id.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="memberPassword"
          className="block text-sm font-semibold text-blue-700 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="memberPassword"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            className={`w-full pl-9 pr-4 py-2 border rounded-lg placeholder-gray-400 bg-blue-50/70 text-gray-700
              ${
                errors.password
                  ? "border-red-400 ring-red-200"
                  : "border-blue-100"
              }`}
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-2">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-400 to-blue-400 text-white rounded-lg font-bold transition duration-300 shadow-lg"
      >
        회원 로그인
      </button>
    </form>
  );
}

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col md:flex-row items-stretch justify-center h-[95vh] gap-10 bg-gradient-to-br from-blue-50 via-white to-purple-100 px-3 sm:px-8">
      <Card title="사장님 로그인">
        <OwnerLoginForm />
      </Card>
      <Card title="회원 로그인">
        <MemberLoginForm />
        <div className="mt-8 text-center text-sm sm:text-base text-gray-600 select-none">
          아직 회원이 아니세요?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/sign-up");
              window.scrollTo(0, 0);
            }}
            className="text-blue-600 font-semibold hover:text-blue-800 underline transition"
          >
            회원가입
          </button>
        </div>
      </Card>
    </section>
  );
};

export default LoginPage;
