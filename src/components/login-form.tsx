import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { Link } from "react-router-dom";
import { SIGN_UP } from "@/constants/route";

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const i18nLogin = useI18n("login");
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {i18nLogin("title")}
                    </CardTitle>
                    <CardDescription>
                        {i18nLogin("description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="account">
                                    {i18nLogin("account")}
                                </Label>
                                <Input
                                    id="account"
                                    placeholder={i18nLogin(
                                        "accountPlaceholder",
                                    )}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">
                                        {i18nLogin("password")}
                                    </Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        {i18nLogin("forgotPassword")}
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder={i18nLogin(
                                        "passwordPlaceholder",
                                    )}
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                {i18nLogin("submit")}
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            {i18nLogin("dontHaveAccount")}{" "}
                            <Link
                                to={SIGN_UP}
                                className="underline underline-offset-4"
                            >
                                {i18nLogin("signUp")}
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
