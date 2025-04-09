import { create } from "zustand";
import { MODEL_SCHEMA, MODEL_LIST } from "@/constants/url";
import request from "@/helpers/request";

interface Option {
    label: string;
    value: string;
}

interface Condition {
    name: string;
    category: string;
    options: Option[];
}

export enum Category {
    Json = "json",
    Number = "number",
    String = "string",
    Date = "date",
    Bytes = "bytes",
}

export interface Schema {
    name: string;
    category: Category;
    read_only: boolean;
    required: boolean;
    fixed: boolean;
    options: Option[] | null;
    hidden: boolean;
}

export interface SchemaView {
    schemas: Schema[];
    conditions: Condition[];
}

interface ModelState {
    model: string;
    schemaView: SchemaView;
    initialized: boolean;
    items: Record<string, unknown>[];
    count: number;
    fetchSchema: (name: string) => Promise<SchemaView>;
    list: (params: {
        page: number;
        limit: number;
        keyword?: string;
    }) => Promise<void>;
}

const useModelState = create<ModelState>((set, get) => ({
    model: "",
    schemaView: {} as SchemaView,
    items: [],
    count: -1,
    initialized: false,
    fetchSchema: async (name: string) => {
        set({
            initialized: false,
        });
        const { data } = await request.get<SchemaView>(MODEL_SCHEMA, {
            params: {
                name,
            },
        });
        set({
            model: name,
            schemaView: data,
            initialized: true,
        });
        return data;
    },
    list: async (params: { page: number; limit: number; keyword?: string }) => {
        const { model, count } = get();
        const shouldCount = count < 0;
        const { data } = await request.get<{
            count: number;
            items: Record<string, unknown>[];
        }>(MODEL_LIST, {
            params: {
                model,
                count: shouldCount,
                ...params,
            },
        });
        if (shouldCount) {
            set({
                items: data.items,
                count: data.count,
            });
        } else {
            set({
                items: data.items,
            });
        }
    },
}));

export default useModelState;
