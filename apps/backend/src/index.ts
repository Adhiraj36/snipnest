import express from 'express';
import cors from 'cors';
import { Notes } from './types';
import { nanoid } from 'nanoid';
import verifyToken from './middleware';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { CLERK_API_KEY } from './secrets';
import { CreateNote, GetUserNotes } from './helpers/notes';

// initialize a Clerk client with API key from env
const clerkClient = createClerkClient({  secretKey: CLERK_API_KEY });

const app = express();

// parse JSON bodies for POST/PUT requests
app.use(express.json());

// enable CORS for all origins and allow Authorization header for preflight
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  })
);

// respond to preflight requests for any route
app.options('*', cors());

const PORT = process.env.PORT || 9000;

app.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
app.post('/notes', verifyToken, async(req,res)=>{
    if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) {
     return res.status(401).send({ error: 'Unauthorized' });
   }
   const userId = req.verified.id;
   type notesreq={
    title:string;
    content:string;
   }
   const {title, content}=req.body as notesreq;
   const note: Notes = {
    id:nanoid(),
    user_id:userId,
    title,
    content,
    created_at: new Date(),
    updated_at: new Date()
   }
   const response = await CreateNote(note)
    return res.status(201).send(response)
})
app.get('/notes', verifyToken, async (req, res) => {
   if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) {
     return res.status(401).send({ error: 'Unauthorized' });
   }
   const userId = req.verified.id;

   const notes = await GetUserNotes(userId)
   return res.status(200).json(notes || []);
});

// expose an endpoint to fetch users from Clerk
app.get('/users/me', verifyToken, async (req, res) => {
    if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) {
     return res.status(401).send({ error: 'Unauthorized' });
   }
   const userId = req.verified.id;
  try {
    const users = await clerkClient.users.getUser(userId);
    return res.status(200).json(users);
  } catch (err) {
    console.error('Failed to fetch users from Clerk', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
