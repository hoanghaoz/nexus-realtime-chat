import { SignInForm } from "@/components/Auth/signin-form";

const SignIn = () => {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">
      {/* Lớp nền THÔNG MINH: Tự đổi màu theo theme sáng/tối */}
      <div className="absolute inset-0 z-0 bg-dynamic-ocean" />

      {/* Nội dung chính */}
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        {/* Logo và Tên App */}
        <div className="flex flex-col items-center gap-2 self-center">
          <img
            src="/nexus.svg"
            className="size-16 drop-shadow-md"
            alt="Nexus Logo"
          />
          <span className="text-2xl font-black tracking-widest text-foreground uppercase">
            NEXUS
          </span>
        </div>

        {/*Form của shadcn */}
        <SignInForm />
      </div>
    </div>
  );
};

export default SignIn;
