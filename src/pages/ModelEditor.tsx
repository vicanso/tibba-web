import { Button } from "@/components/ui/button";
import { formatError } from "@/helpers/util";
import { useI18n } from "@/i18n";
import { goBack } from "@/routers";
import useModelState, { Category } from "@/states/model";
import { useParams, useSearchParams } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useAsync } from "react-async-hook";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loading } from "@/components/loading";
import { toString } from "lodash-es";
import { MultiSelect } from "@/components/multi-select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, StatusRadioGroup } from "@/components/model-components";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import dayjs from "dayjs";
import { DateTimePicker } from "@/components/date-time-picker";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
enum EditType {
    Edit = "edit",
    Create = "create",
    View = "view",
}

export default function ModelEditor() {
    const i18nModelEditor = useI18n("modelEditor");
    const i18nModel = useI18n("model");
    const i18nComponent = useI18n("component");
    const [searchParams] = useSearchParams();
    const { name: modelName, id } = useParams();
    const [initialized, setInitialized] = useState(false);
    const [detail, setDetail] = useState<Record<string, unknown>>({});
    const [schemaView, fetchSchema, modelDetail, modelUpdate, modelCreate] =
        useModelState(
            useShallow((state) => [
                state.schemaView,
                state.fetchSchema,
                state.detail,
                state.update,
                state.create,
            ]),
        );
    const modelId = Number(id);
    let editType = EditType.View;
    if (searchParams.get("type") === "edit") {
        if (modelId === 0) {
            editType = EditType.Create;
        } else {
            editType = EditType.Edit;
        }
    }

    const zodSchema: Record<string, z.ZodTypeAny> = {};
    schemaView.schemas?.forEach((item) => {
        const { name, category, read_only, required } = item;
        if (editType === EditType.Create && item.auto_create) {
            return;
        }
        if (editType !== EditType.Create && read_only) {
            return;
        }

        switch (category) {
            case Category.Strings: {
                zodSchema[name] = z.array(z.string());
                break;
            }
            case Category.Status: {
                zodSchema[name] = z.number().min(0).max(1);
                break;
            }
            case Category.Boolean: {
                zodSchema[name] = z.boolean();
                break;
            }
            case Category.Number: {
                zodSchema[name] = z.number();
                break;
            }
            default:
                zodSchema[name] = z.string();
                break;
        }
        if (!required) {
            zodSchema[name] = zodSchema[name].optional();
        }
    });
    const form = useForm({
        resolver: zodResolver(z.object(zodSchema)),
        defaultValues: detail,
        mode: "onChange",
    });

    function formatValue(values: Record<string, unknown>) {
        const categoryDict: Record<string, Category> = {};
        schemaView.schemas?.forEach((schema) => {
            const { name, category } = schema;
            categoryDict[name] = category;
        });
        const data: Record<string, unknown> = {};

        Object.keys(values).forEach((key) => {
            switch (categoryDict[key]) {
                case Category.Json: {
                    data[key] = JSON.parse(values[key] as string);
                    break;
                }
                case Category.Number: {
                    data[key] = Number(values[key]);
                    break;
                }
                default:
                    data[key] = values[key];
                    break;
            }
        });
        return data;
    }

    async function handleUpdate(values: Record<string, unknown>) {
        const updateData: Record<string, unknown> = {};
        Object.keys(form.formState.dirtyFields).forEach((key) => {
            if (form.formState.dirtyFields[key]) {
                updateData[key] = values[key];
            }
        });
        if (Object.keys(updateData).length === 0) {
            toast.info(i18nModelEditor("noChange"));
            return;
        }

        try {
            await modelUpdate({
                id: modelId,
                model: modelName || "",
                data: formatValue(updateData),
            });
            toast.success(i18nModelEditor("updateSuccess"));
        } catch (err) {
            toast.error(formatError(err));
        }
    }
    async function handleCreate(values: Record<string, unknown>) {
        try {
            await modelCreate({
                model: modelName || "",
                data: formatValue(values),
            });
            toast.success(i18nModelEditor("createSuccess"));
        } catch (err) {
            toast.error(formatError(err));
        }
    }

    function onSubmit(values: Record<string, unknown>) {
        if (editType === EditType.Create) {
            handleCreate(values);
        } else {
            handleUpdate(values);
        }
    }

    useAsync(async () => {
        try {
            const id = Number(modelId);
            const model = modelName || "";
            await fetchSchema(model);
            if (id) {
                const data = await modelDetail({
                    id,
                    model,
                });
                setDetail(data);
                form.reset(data);
            }
        } catch (err) {
            toast.error(formatError(err));
        } finally {
            setInitialized(true);
        }
    }, [modelName, modelId]);

    if (!initialized) {
        return <Loading />;
    }

    const formItems = schemaView.schemas
        .filter((schema) => {
            if (schema.name === "id") {
                return false;
            }
            if (editType === EditType.Create && schema.auto_create) {
                return false;
            }
            if (
                editType === EditType.Edit &&
                ["created", "modified"].includes(schema.name)
            ) {
                return false;
            }
            return true;
        })
        .map((schema) => {
            const { name, category, options } = schema;
            let disabled = editType == EditType.View;
            if (editType === EditType.Edit) {
                disabled = schema.read_only;
            }

            const value = toString(detail[name]);
            let valueField = (
                <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => {
                        let dom = (
                            <Input
                                {...field}
                                value={field.value || ""}
                                disabled={disabled}
                                readOnly={disabled}
                            />
                        );
                        if (category === Category.Json) {
                            dom = (
                                <Textarea
                                    {...field}
                                    value={field.value || ""}
                                    disabled={disabled}
                                    readOnly={disabled}
                                />
                            );
                        }
                        return (
                            <FormItem>
                                <FormLabel>{name}</FormLabel>
                                <FormControl>{dom}</FormControl>
                            </FormItem>
                        );
                    }}
                />
            );
            if (category === Category.Status) {
                valueField = (
                    <FormField
                        control={form.control}
                        name={name}
                        render={() => (
                            <FormItem>
                                <FormLabel>{name}</FormLabel>
                                <FormControl>
                                    <StatusBadge
                                        status={value}
                                        i18nModel={i18nModel}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                );
            }
            let canEdit = true;
            if (editType === EditType.View) {
                canEdit = false;
            }
            if (editType === EditType.Edit && schema.read_only) {
                canEdit = false;
            }
            if (canEdit) {
                switch (category) {
                    case Category.Strings: {
                        valueField = (
                            <FormField
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{name}</FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                {...field}
                                                disabled={disabled}
                                                options={options || []}
                                                selected={
                                                    form.getValues(name) || []
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        );
                        break;
                    }
                    case Category.Status: {
                        valueField = (
                            <FormField
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{name}</FormLabel>
                                        <FormControl>
                                            <StatusRadioGroup
                                                {...field}
                                                status={value}
                                                i18nModel={i18nModel}
                                                onValueChange={(value) =>
                                                    field.onChange(
                                                        Number(value),
                                                    )
                                                }
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        );
                        break;
                    }
                    case Category.Date: {
                        valueField = (
                            <FormField
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{name}</FormLabel>
                                        <FormControl>
                                            <DateTimePicker
                                                {...field}
                                                date={field.value}
                                                i18n={i18nComponent}
                                                setDate={(date) => {
                                                    if (date) {
                                                        field.onChange(
                                                            dayjs(date).format(
                                                                "YYYY-MM-DDTHH:mm:ssZ",
                                                            ),
                                                        );
                                                    } else {
                                                        field.onChange(null);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        );
                        break;
                    }
                    case Category.Json: {
                        valueField = (
                            <FormField
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{name}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value || ""}
                                                disabled={disabled}
                                                readOnly={disabled}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        );
                        break;
                    }
                    default: {
                        if (options) {
                            valueField = (
                                <FormField
                                    control={form.control}
                                    name={name}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{name}</FormLabel>
                                            <FormControl>
                                                <Select
                                                    {...field}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue
                                                            placeholder={name}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                {name}
                                                            </SelectLabel>
                                                            {options.map(
                                                                (option) => (
                                                                    <SelectItem
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            );
                        }
                        break;
                    }
                }
            }
            const span = schema.span || 1;
            return (
                <div
                    className={cn(
                        "gap-2",
                        span === 1 ? "col-span-1" : "",
                        span === 2 ? "col-span-2" : "",
                        span === 3 ? "col-span-3" : "",
                        span === 4 ? "col-span-4" : "",
                    )}
                    key={name}
                >
                    {valueField}
                </div>
            );
        });
    return (
        <div>
            <h1>
                {modelName?.toUpperCase()}{" "}
                {modelId !== 0 && <Badge variant="secondary">{modelId}</Badge>}
            </h1>
            <Form {...form}>
                <form className="mt-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-4">{formItems}</div>
                    <div className="flex gap-4 w-full mt-4">
                        {editType !== EditType.View && (
                            <Button
                                className=" mb-4 flex-1"
                                type="submit"
                                disabled={!form.formState.isDirty}
                            >
                                {i18nModelEditor("update")}
                            </Button>
                        )}
                        <Button
                            className="mb-4 flex-1"
                            variant="secondary"
                            onClick={(e) => {
                                e.preventDefault();
                                goBack();
                            }}
                        >
                            {i18nModelEditor("back")}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
