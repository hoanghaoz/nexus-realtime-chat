import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
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

// Định nghĩa schema cho form đăng nhập
const signInSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
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
      email: "",
      password: "",
    },
  });

  // Hàm xử lý khi dữ liệu đã SẠCH
  const onSubmit = (values: z.infer<typeof signInSchema>) => {
    // Gọi API Backend
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
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.email.message}
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
        <a href="#">Điều khoản Dịch vụ</a> and{" "}
        <a href="#">Chính sách Bảo mật</a>.
      </FieldDescription>
    </div>
  );
}
