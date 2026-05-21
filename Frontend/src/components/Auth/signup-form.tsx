import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

type SignUpErrors = Partial<
  Record<"username" | "password" | "confirmPassword", string>
>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp } = useAuthStore();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: SignUpErrors = {};

    if (username.length < 4) {
      nextErrors.username = "Username phải có ít nhất 4 kí tự.";
    }
    if (password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 kí tự.";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await signUp(username, password);
      navigate("/sign-in"); // đăng ký xong → chuyển tới trang đăng nhập
    } catch {
      // Lỗi đã được xử lý bởi toast bên trong useAuthStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng ký tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="nguyenvana"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.username}
                  </p>
                )}
              </Field>
              <Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.password}
                      </p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Xác nhận mật khẩu
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </Field>
                </div>
                <FieldDescription>
                  Mật khẩu phải có ít nhất 6 ký tự.
                </FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Tạo tài khoản
                </Button>
                <FieldDescription className="text-center">
                  Nếu bạn đã có tài khoản?{" "}
                  <Link
                    to="/sign-in"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Đăng nhập
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Bằng cách nhấn vào "Tạo tài khoản", bạn đồng ý với{" "}
        <Link
          to="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Điều khoản Dịch vụ
        </Link>{" "}
        and{" "}
        <Link
          to="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Chính sách Bảo mật
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
