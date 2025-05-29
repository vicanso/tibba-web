"use client";
import { Badge } from "@/components/ui/badge";
import { Label } from "@radix-ui/react-label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toString } from "lodash-es";

export function StatusBadge({
    status,
    i18nModel,
}: {
    status: string;
    i18nModel: (value: string) => string;
}) {
    let element = <></>;
    if (toString(status) === "1") {
        element = (
            <Badge variant="default" className="bg-blue-500 text-white h-6">
                {i18nModel("active")}
            </Badge>
        );
    } else {
        element = (
            <Badge variant="destructive" className="h-6">
                {i18nModel("inactive")}
            </Badge>
        );
    }

    return element;
}

export function ResultBadge({
    result,
    i18nModel,
}: {
    result: string;
    i18nModel: (value: string) => string;
}) {
    let element = <></>;
    if (result === "1") {
        element = (
            <Badge variant="destructive" className="h-6">
                {i18nModel("failed")}
            </Badge>
        );
    } else {
        element = (
            <Badge variant="default" className="bg-blue-500 text-white h-6">
                {i18nModel("success")}
            </Badge>
        );
    }

    return element;
}

export function StatusRadioGroup({
    status,
    i18nModel,
    onValueChange,
}: {
    status: string;
    i18nModel: (value: string) => string;
    onValueChange: (value: string) => void;
}) {
    return (
        <RadioGroup
            defaultValue={status}
            className="flex flex-row gap-2"
            onValueChange={onValueChange}
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="r1" className="cursor-pointer" />
                <Label htmlFor="r1" className="cursor-pointer">
                    {i18nModel("active")}
                </Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="r2" className="cursor-pointer" />
                <Label htmlFor="r2" className="cursor-pointer">
                    {i18nModel("inactive")}
                </Label>
            </div>
        </RadioGroup>
    );
}
