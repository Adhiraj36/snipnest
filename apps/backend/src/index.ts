import express from 'express';
import cors from 'cors';
import { Notes } from './types';
import { nanoid } from 'nanoid'
import { loadJSON, saveJSON } from './utils';
import verifyToken from './middleware';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { CLERK_API_KEY } from './secrets';
import { CreateNote } from 'helpers/notes';

// initialize a Clerk client with API key from env
const clerkClient = createClerkClient({  secretKey: CLERK_API_KEY });

const app = express();
// users are managed by Clerk; we only store notes
const notesPath = "./notes.json"

// parse JSON bodies for POST/PUT requests
app.use(express.json());

// enable CORS for all origins
app.use(cors({ origin: '*' }));

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
   try {
    await CreateNote(note)
    return res.status(201).send({note})
   } catch (e) {
    return res.status(500).send({
      "error": "db error",
      "e": e
    })
   }
    
})
app.get('/notes', verifyToken, async (req, res) => {
   if (!req.verified || typeof req.verified === 'string' || !('id' in req.verified)) {
     return res.status(401).send({ error: 'Unauthorized' });
   }
   const userId = req.verified.id;

   const notes = await loadJSON<Notes[]>(notesPath);
   const usernotes = notes?.filter(n => n.user_id === userId);
   return res.status(200).json(usernotes || []);
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
