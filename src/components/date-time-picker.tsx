import * as React from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
}

export function DateTimePicker({
    date,
    setDate,
    className,
}: DateTimePickerProps) {
    // 使用 ref 来跟踪是否是用户手动更改时间
    const isUserTimeChange = React.useRef(false);

    // 从日期中提取时间
    const getTimeFromDate = (date: Date | undefined) => {
        if (!date) return "";
        return dayjs(date).format("HH:mm");
    };

    // 初始时间状态
    const [selectedTime, setSelectedTime] = React.useState<string>(
        getTimeFromDate(date),
    );

    // 处理日期变化
    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            // 如果已有时间，保留时间部分
            if (selectedTime) {
                const [hours, minutes] = selectedTime.split(":").map(Number);
                const dateWithTime = new Date(newDate);
                dateWithTime.setHours(hours);
                dateWithTime.setMinutes(minutes);
                setDate(dateWithTime);
            } else {
                setDate(newDate);
            }
        } else {
            setDate(undefined);
        }
    };

    // 处理时间变化
    const handleTimeChange = (hours: string, minutes: string) => {
        isUserTimeChange.current = true;
        const newTime = `${hours}:${minutes}`;
        setSelectedTime(newTime);

        if (date) {
            const newDate = new Date(date);
            newDate.setHours(parseInt(hours, 10));
            newDate.setMinutes(parseInt(minutes, 10));
            setDate(newDate);
        }
    };

    // 当外部日期变化时更新时间（仅当不是用户手动更改时）
    React.useEffect(() => {
        if (!isUserTimeChange.current && date) {
            setSelectedTime(getTimeFromDate(date));
        }
        isUserTimeChange.current = false;
    }, [date]);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground",
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? (
                                dayjs(date).format("YYYY-MM-DD")
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                    <Select
                        value={selectedTime ? selectedTime.split(":")[0] : ""}
                        onValueChange={(value) => {
                            const minutes = selectedTime
                                ? selectedTime.split(":")[1]
                                : "00";
                            handleTimeChange(value, minutes);
                        }}
                    >
                        <SelectTrigger className="w-[70px]">
                            <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem
                                    key={i}
                                    value={i.toString().padStart(2, "0")}
                                >
                                    {i.toString().padStart(2, "0")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select
                        value={selectedTime ? selectedTime.split(":")[1] : ""}
                        onValueChange={(value) => {
                            const hours = selectedTime
                                ? selectedTime.split(":")[0]
                                : "00";
                            handleTimeChange(hours, value);
                        }}
                    >
                        <SelectTrigger className="w-[70px]">
                            <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                                <SelectItem
                                    key={i}
                                    value={i.toString().padStart(2, "0")}
                                >
                                    {i.toString().padStart(2, "0")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

// 表单字段版本，用于与 react-hook-form 集成
interface DateTimePickerFieldProps extends DateTimePickerProps {
    name: string;
    label?: string;
    error?: boolean;
    helperText?: string;
}

export function DateTimePickerField({
    name,
    label,
    error,
    helperText,
    ...props
}: DateTimePickerFieldProps) {
    return (
        <div className="grid gap-1.5">
            {label && (
                <label
                    htmlFor={name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {label}
                </label>
            )}
            <DateTimePicker {...props} />
            {helperText && (
                <p
                    className={cn(
                        "text-sm",
                        error ? "text-destructive" : "text-muted-foreground",
                    )}
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}
