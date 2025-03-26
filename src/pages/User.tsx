import useBasicState from "@/states/basic";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";

export default function User() {
    const [setPageHeaderNavigation, resetPageHeaderNavigation] = useBasicState(
        useShallow((state) => [
            state.setPageHeaderNavigation,
            state.resetPageHeaderNavigation,
        ]),
    );
    useEffect(() => {
        setPageHeaderNavigation([
            {
                title: "UserA",
                url: "/",
            },
            {
                title: "UserB",
                url: "/login",
            },
        ]);
        return () => {
            resetPageHeaderNavigation();
        };
    });
    return (
        <div>
            <h1>User</h1>
        </div>
    );
}
