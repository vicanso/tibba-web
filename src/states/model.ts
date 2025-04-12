import { create } from "zustand";
import { MODEL_SCHEMA, MODEL_LIST } from "@/constants/url";
import request from "@/helpers/request";

interface Option {
    label: string;
    value: string;
}

export enum ConditionCategory {
    Input = "input",
    Select = "select",
}

interface Condition {
    name: string;
    category: ConditionCategory;
    options: Option[];
}

export enum Category {
    String = "string",
    Number = "number",
    Bytes = "bytes",
    Boolean = "boolean",
    Status = "status",
    Strings = "strings",
    Date = "date",
    Json = "json",
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
    sort_fields: string[];
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
        order_by?: string;
        filters?: Record<string, string>;
    }) => Promise<void>;
    reset: () => void;
}

const useModelState = create<ModelState>((set, get) => ({
    model: "",
    schemaView: {} as SchemaView,
    items: [],
    count: -1,
    initialized: false,
    reset() {
        set({
            items: [],
            count: -1,
        });
    },
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
    list: async (params: {
        page: number;
        limit: number;
        keyword?: string;
        filters?: Record<string, string>;
        order_by?: string;
    }) => {
        const { model, count } = get();
        const shouldCount = count < 0;
        let filters = "";
        if (Object.keys(params.filters || {}).length > 0) {
            filters = JSON.stringify(params.filters);
        }
        const { data } = await request.get<{
            count: number;
            items: Record<string, unknown>[];
        }>(MODEL_LIST, {
            params: {
                model,
                count: shouldCount,
                page: params.page,
                limit: params.limit,
                keyword: params.keyword,
                order_by: params.order_by,
                filters,
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
