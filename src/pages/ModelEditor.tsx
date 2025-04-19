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

export default function ModelEditor() {
    const i18nModelEditor = useI18n("modelEditor");
    const i18nModel = useI18n("model");
    const [searchParams] = useSearchParams();
    const { name: modelName, id: modelId } = useParams();
    const [initialized, setInitialized] = useState(false);
    const [detail, setDetail] = useState<Record<string, unknown>>({});
    const [schemaView, fetchSchema, modelDetail, modelUpdate] = useModelState(
        useShallow((state) => [
            state.schemaView,
            state.fetchSchema,
            state.detail,
            state.update,
        ]),
    );
    const zodSchema: Record<string, z.ZodTypeAny> = {};
    schemaView.schemas?.forEach((item) => {
        const { name, category, read_only, required } = item;
        if (read_only) {
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
    });

    async function onSubmit(values: Record<string, unknown>) {
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
                id: Number(modelId),
                model: modelName || "",
                data: updateData,
            });
            toast.success(i18nModelEditor("updateSuccess"));
        } catch (err) {
            toast.error(formatError(err));
        }
    }

    useAsync(async () => {
        try {
            const model = modelName || "";
            const id = Number(modelId);
            await fetchSchema(model);
            const data = await modelDetail({
                id,
                model,
            });
            setDetail(data);
            form.reset(data);
        } catch (err) {
            toast.error(formatError(err));
        } finally {
            setInitialized(true);
        }
    }, [modelName, modelId]);

    if (!initialized) {
        return <Loading />;
    }

    const editing = searchParams.get("type") === "edit";
    const formItems = schemaView.schemas
        .filter((schema) => schema.name !== "id")
        .map((schema) => {
            const { name, category, options } = schema;
            const disabled = !editing || schema.read_only;
            const value = toString(detail[name]);
            let valueField = (
                <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{name}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    disabled={disabled}
                                    readOnly={disabled}
                                />
                            </FormControl>
                        </FormItem>
                    )}
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
            if (editing) {
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
                }
            }
            return (
                <div className="grid gap-2" key={name}>
                    {valueField}
                </div>
            );
        });
    return (
        <div>
            <h1>
                {modelName?.toUpperCase()}{" "}
                <Badge variant="secondary">{toString(detail.id)}</Badge>
            </h1>
            <Form {...form}>
                <form className="mt-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-4">{formItems}</div>
                    <div className="flex gap-4 w-full mt-4">
                        {editing && (
                            <Button
                                className=" mb-4 cursor-pointer flex-1"
                                type="submit"
                                disabled={!form.formState.isDirty}
                            >
                                {i18nModelEditor("update")}
                            </Button>
                        )}
                        <Button
                            className="mb-4 cursor-pointer flex-1"
                            variant="secondary"
                            onClick={() => goBack()}
                        >
                            {i18nModelEditor("back")}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
