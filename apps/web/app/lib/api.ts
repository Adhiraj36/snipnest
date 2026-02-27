"use client"
import axios from "axios";

const getBackendURL = () => {
    if (typeof window !== 'undefined') {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (backendUrl) return backendUrl;
        const host = window.location.hostname;
        if (host.includes('app.github.dev')) {
            return `https://${host.replace('-3000.', '-9000.')}`;
        }
        return 'http://localhost:9000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000';
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