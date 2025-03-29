import { ProfileForm } from "@/components/profile-form";
import { useI18n } from "@/i18n";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import useBasicState from "@/states/basic";

export default function Profile() {
    const profileI18n = useI18n("profile");
    const [setPageHeaderNavigation, resetPageHeaderNavigation] = useBasicState(
        useShallow((state) => [
            state.setPageHeaderNavigation,
            state.resetPageHeaderNavigation,
        ]),
    );
    useEffect(() => {
        setPageHeaderNavigation([
            {
                title: profileI18n("title"),
            },
        ]);
        return () => {
            resetPageHeaderNavigation();
        };
    });

    return (
        <div className="flex w-full items-center justify-center p-6">
            <div className="w-full">
                <ProfileForm />
            </div>
        </div>
    );
}
