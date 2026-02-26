import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Notes } from '../src/types';
import { notes } from '../db/schema';

const db = drizzle(process.env.DATABASE_URL!);

export const CreateNote = async (note: Notes) => {
    try {
        await db.insert(notes).values(note);
        return { success: true };
    } catch (e) {
        console.error('CreateNote error', e);
        return { success: false, error: e };
    }
};

export const GetNoteById = async(id: string) => {
    try {
        const note = await db.select().from(notes).where(eq(notes.id, id))
        return note
    } catch (e) {
        console.error('CreateNote error', e);
        return { success: false, error: e };
    }
}

export const GetUserNotes = async(user_id: string) => {
    try {
        const userNotes = await db.select().from(notes).where(eq(notes.user_id, user_id))
        return userNotes
    } catch (e) {
        console.error('CreateNote error', e);
        return { success: false, error: e };
    }
}