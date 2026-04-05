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
import { Link } from "react-router-dom";

// Định nghĩa schema cho form đăng ký
const signUpSchema = z
  .object({
    name: z.string().min(1, "Tên không được để trống"),
    username: z.string().min(4, "Username phải có ít nhất 4 kí tự."),
    email: z.string().email("Email không đúng định dạng"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 kí tự."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Tạo useForm
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Hàm xử lý khi dữ liệu đã SẠCH
  const onSubmit = (values: z.infer<typeof signUpSchema>) => {
    // Gọi API Backend
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng ký tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Họ và Tên</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="nguyenvana"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </Field>
              <Field>
                <div className="grid grid-cols-2 gap-4">
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
                    <FieldLabel htmlFor="confirm-password">
                      Xác nhận mật khẩu
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </Field>
                </div>
                <FieldDescription>
                  Mật khẩu phải có ít nhất 8 ký tự.
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
        <a href="#">Điều khoản Dịch vụ</a> and{" "}
        <a href="#">Chính sách Bảo mật</a>.
      </FieldDescription>
    </div>
  );
}
