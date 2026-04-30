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

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

// Định nghĩa schema cho form đăng nhập (sử dụng username)
const signInSchema = z.object({
  username: z.string().min(1, "Username không được để trống"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự."),
});

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Tạo useForm
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Hàm xử lý khi dữ liệu đã SẠCH
 const auth = useContext(AuthContext);
 const navigate = useNavigate();

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
  try {
    await auth.login({ username: values.username, password: values.password });
    navigate("/"); // điều hướng sau khi đăng nhập
  } catch (err: any) {
    // hiển thị lỗi đơn giản
    alert(err?.response?.data || err.message || "Đăng nhập thất bại");
  }
};

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng nhập vào Nexus</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input id="username" type="text" {...register("username")} />
                {errors.username && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Đăng nhập
                </Button>
                <FieldDescription className="text-center">
                  Chưa có tài khoản?{" "}
                  <Link
                    to="/sign-up"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Đăng ký
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
