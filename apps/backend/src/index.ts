import express from 'express';
import { Notes, User } from './types';
import { nanoid } from 'nanoid'
import { loadJSON, saveJSON } from './utils';

const app = express();
const userPath = "./users.json"
const notesPath = "./notes.json"

// parse JSON bodies for POST/PUT requests
app.use(express.json());

const PORT = process.env.PORT || 9000;

app.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.post('/notes', (req, res) => {
    console.log(req.body)
    if (req.body.user === 1) {
        res.status(200).send([
    { id: 1, title: 'Note 1', content: 'This is the first note.' },
    { id: 2, title: 'Note 2', content: 'This is the second note.' },
  ]);
    } else {
        res.status(401).send({ error: 'Unauthorized' });
    }
});

app.post('/users/register', async (req, res) => {
    type RequestBody = {
        name: string;
        email: string;
        password: string;
    }
    const { name: username, email, password } = req.body as RequestBody;
    let existingUsers = await loadJSON<User[]>(userPath)

    if (existingUsers?.some(u => u.email === email)) {
        return res.status(400).send({ error: "user already exists!" });
    }

    if(password.length < 6) {
        return res.status(400).send({ error: 'Password must be at least 6 characters long.' });
    }
    
    const user: User = {
        id: nanoid(),
        name: username,
        password,
        email,
    } 

    
    if (existingUsers) {
        existingUsers.push(user)
        await saveJSON<User[]>(userPath, existingUsers)
        return res.status(201).send(user)
    } else {
        await saveJSON<User[]>(userPath, [user])
        return res.status(201).send(user)
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
