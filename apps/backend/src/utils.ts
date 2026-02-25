// utils/jsonFile.ts
import { promises as fs } from "fs";

export async function saveJSON<T>(path: string, data: T): Promise<void> {
  await fs.writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export async function loadJSON<T>(path: string): Promise<T | null> {
  try {
    const txt = await fs.readFile(path, "utf-8");
    return JSON.parse(txt) as T;
  } catch (e: any) {
    if (e.code === "ENOENT") return null; // file not found
    throw e;
  }
}