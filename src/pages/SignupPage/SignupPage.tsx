import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiMail } from "react-icons/fi";
import { registerUser } from "../../store/thunkFunctions";
import { useAppDispatch } from "../../store/hooks";

type FormData = {
  name: string; // 사용자 이름 (닉네임 등)
  email: string;
  password: string;
  confirmPassword: string;
  role: string; // 회원 유형 (0: 일반 회원, 1: 업체 대표)
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({ mode: "onChange" });

  const dispatch = useAppDispatch();

  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    const body = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: Number(data.role),
    };

    dispatch(registerUser(body));
    reset();
  };

  const userName = { required: "이름을 입력해주세요." };
  const userEmail = {
    required: "이메일을 입력해주세요.",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "올바른 이메일 형식이 아닙니다.",
    },
  };
  const userPassword = {
    required: "비밀번호를 입력해주세요.",
    minLength: {
      value: 6,
      message: "비밀번호는 최소 6자 이상이어야 합니다.",
    },
  };
  const confirmPassword = {
    required: "비밀번호 확인을 입력해주세요.",
    validate: (value: string) =>
      value === password || "비밀번호가 일치하지 않습니다.",
  };

  return (
    <section className="relative flex items-center justify-center h-[90vh] lg:h-[130vh] bg-gradient-to-br from-blue-50 via-white to-purple-100 overflow-hidden px-2 sm:px-4">
      {/* 배경 원형 패턴 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] bg-blue-100/60 rounded-full blur-3xl"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] bg-purple-100/40 rounded-full blur-2xl"></div>
      </div>

      {/* 회원가입 카드 */}
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
          회원 가입
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 sm:space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-blue-700 mb-2"
            >
              User Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
              <input
                id="name"
                type="text"
                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition placeholder-gray-400 bg-blue-50/70 text-gray-700 text-sm sm:text-base ${
                  errors.name
                    ? "border-red-400 ring-red-200"
                    : "border-blue-100"
                }`}
                {...register("name", userName)}
                placeholder="Enter your name"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-blue-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
              <input
                id="email"
                type="email"
                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition placeholder-gray-400 bg-blue-50/70 text-gray-700 text-sm sm:text-base ${
                  errors.email
                    ? "border-red-400 ring-red-200"
                    : "border-blue-100"
                }`}
                {...register("email", userEmail)}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-blue-700 mb-2">
              회원 유형
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="0"
                  {...register("role")}
                  defaultChecked
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">일반 회원</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="1"
                  {...register("role")}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">업체 대표</span>
              </label>
            </div>
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
                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition placeholder-gray-400 bg-blue-50/70 text-gray-700 text-sm sm:text-base ${
                  errors.password
                    ? "border-red-400 ring-red-200"
                    : "border-blue-100"
                }`}
                {...register("password", userPassword)}
                placeholder="Enter your password"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-blue-700 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
              <input
                id="confirmPassword"
                type="password"
                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition placeholder-gray-400 bg-blue-50/70 text-gray-700 text-sm sm:text-base ${
                  errors.confirmPassword
                    ? "border-red-400 ring-red-200"
                    : "border-blue-100"
                }`}
                {...register("confirmPassword", confirmPassword)}
                placeholder="Confirm your password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-2 flex items-center">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-400 to-blue-400 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-500 transition duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-60 text-base sm:text-lg tracking-wide"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm sm:text-base text-gray-600 select-none">
          이미 회원이신가요?{" "}
          <button
            type="button"
            onClick={() => {
              navigate("/log-in");
              window.scrollTo(0, 0);
            }}
            className="text-blue-600 font-semibold hover:text-blue-800 underline transition duration-200"
          >
            로그인
          </button>
        </div>
      </div>
    </section>
  );
};

export default SignUpPage;
