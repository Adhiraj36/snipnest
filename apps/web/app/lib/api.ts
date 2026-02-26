"use client"
import axios from "axios";

const api = axios.create({
    baseURL: "https://bookish-winner-pj6rxr4495pjf9x7-9000.app.github.dev",
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
): Promise<ApiResult<any>> {
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

export async function getUserNotes(token: string): Promise<ApiResult<any>> {
    try {
        const resp = await api.get("/notes", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, data: resp.data };
    } catch (err: any) {
        console.error(err);
        return { success: false, error: err?.message || String(err) };
    }
}