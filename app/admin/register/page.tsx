"use client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { EyeIcon, EyeClosedIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "password must be at least 6 characters long"),
});

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { email, password, name } = values;
      const { data, error } = await authClient.signUp.email({
        email: email,
        password: password,
        name: name,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("User has been created successfully.");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto max-w-3xl space-y-8 py-10"
        >
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              placeholder="Enter Your Name"
              {...form.register("name")}
            />

            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              placeholder="Enter Your Email"
              {...form.register("email")}
            />

            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative flex w-full items-center">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Your Password."
                className="pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center cursor-pointer"
              >
                {showPassword ? (
                  <EyeClosedIcon size={16} />
                ) : (
                  <EyeIcon size={16} />
                )}
              </button>
            </div>

            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
          <Button type="submit">Submit</Button>
        </form>
      </FormProvider>
    </div>
  );
}
