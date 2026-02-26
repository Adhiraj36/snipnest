export type Notes = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: Date;
    updated_at: Date;
}

// Clerk manages user records; the backend only cares about the authenticated
// user's identifier which comes from the JWT payload.
export type UserClaims = {
    id: string;
}