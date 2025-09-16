import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock } from "react-icons/fi";
import axiosInstance from "../../utils/axios";

type FormData = {
  id: string;
  password: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ mode: "onChange" });

  const onSubmit = async ({ id, password }: FormData) => {
    const body = { id, password };
    try {
      const response = await axiosInstance.post("/admin/login", body);
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

  const userId = { required: "ID is required" };
  const userPassword = {
    required: "Password is required",
    minLength: {
      value: 6,
      message: "Password must be at least 6 characters long",
    },
  };

  return (
    <section className="relative flex items-center justify-center h-[90vh] lg:h-[90vh] bg-gradient-to-br from-blue-50 via-white to-purple-100 overflow-hidden px-2 sm:px-4">
      {/* 배경 원형 패턴 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] bg-blue-100/60 rounded-full blur-3xl"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] bg-purple-100/40 rounded-full blur-2xl"></div>
      </div>

      {/* 로그인 카드 */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white/90 rounded-2xl shadow-2xl border border-blue-100 p-5 sm:p-8 md:p-10 animate-fadein drop-shadow-xl">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow bg-gradient-to-tr from-blue-400 via-purple-300 to-blue-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white sm:h-10 sm:w-10"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zM12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8z" />
            </svg>
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-center text-blue-700 mb-8 tracking-wide select-none">
          회원 로그인
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 sm:space-y-6"
        >
          <div>
            <label
              htmlFor="id"
              className="block text-sm font-semibold text-blue-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
              <input
                id="id"
                type="text"
                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition placeholder-gray-400 bg-blue-50/70 text-gray-700 text-sm sm:text-base
                  ${
                    errors.id
                      ? "border-red-400 ring-red-200"
                      : "border-blue-100"
                  }`}
                {...register("id", userId)}
                autoComplete="username"
                placeholder="Enter User ID"
              />
            </div>
            {errors.id && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.id.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-blue-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
              <input
                id="password"
                type="password"
                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition placeholder-gray-400 bg-blue-50/70 text-gray-700 text-sm sm:text-base
                  ${
                    errors.password
                      ? "border-red-400 ring-red-200"
                      : "border-blue-100"
                  }`}
                {...register("password", userPassword)}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-400 to-blue-400 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-500 transition duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-60 text-base sm:text-lg tracking-wide"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center text-sm sm:text-base text-gray-600 select-none">
          아직 회원이 아니세요?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/sign-up");
              window.scrollTo(0, 0);
            }}
            className="text-blue-600 font-semibold hover:text-blue-800 underline transition duration-200"
          >
            회원가입
          </button>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
