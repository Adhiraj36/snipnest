"use client"
import axios from "axios";
import type { Notes } from "@repo/shared-types";

const BACKEND_URL = "https://organic-couscous-x54wjw77x4jvhpv4q-9000.app.github.dev"

const getBackendURL = () => {
    return BACKEND_URL;
};

const api = axios.create({
    baseURL: getBackendURL(),
    headers: {
        "Content-Type": "application/json",
    },
});

type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function getMe(token: string): Promise<ApiResult<any>> {
    try {
        const resp = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log(resp)
        return { success: true, data: resp.data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function postUserNote(
    token: string,
    title: string,
    content: string
): Promise<ApiResult<{ success: boolean }>> {
    try {
        const resp = await api.post(
            "/notes",
            { title, content },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return { success: true, data: resp.data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}

export async function getUserNotes(token: string): Promise<ApiResult<Notes[]>> {
    try {
        const resp = await api.get("/notes", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data as Notes[] };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}