
import { cn } from "@/lib/utils";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";
import { useAsync } from "react-async-hook";
import useCommonState from "@/states/common";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { formatError } from "@/helpers/util";

interface CaptchaProps {
    className?: string;
    level?: number;
    onChange: (value: string) => void;
}

export function Captcha({ className, onChange }: CaptchaProps) {
    const [fetchCaptcha] = useCommonState(
        useShallow((state) => [state.fetchCaptcha]),
    );
    const [captcha, setCaptcha] = useState({
        id: "",
        data: "",
    });
    const refreshCaptcha = async () => {
        setCaptcha({
            id: "",
            data: "",
        });
        try {
            const data = await fetchCaptcha();
            setCaptcha(data);
        } catch (error) {
            toast.error(formatError(error));
            setCaptcha({
                id: "",
                data: "",
            });
        }
    };

    useAsync(refreshCaptcha, []);

    return (

        <div className={cn("flex items-center gap-2", className)}>
            <InputOTP maxLength={4} onChange={(value) => {
                if (captcha.id) {
                    onChange(`${captcha.id}:${value}`);
                } else {
                    onChange("");
                }
            }}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                </InputOTPGroup>
            </InputOTP>
            <div>
                {captcha.id && (
                    <img
                        onClick={refreshCaptcha}
                        style={{
                            height: "32px",
                            cursor: "pointer",
                        }}
                        src={`data:image/png;base64,${captcha.data}`}
                        alt="captcha"
                    />
                )}
            </div>
        </div>
    );
}
