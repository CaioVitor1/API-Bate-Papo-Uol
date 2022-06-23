import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
//configurações express
const app = express();
app.use(cors());
app.use(express.json());
//configurações mongodb
let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI); 
const promise = mongoClient.connect();
promise.then(() => db = mongoClient.db("batePapoUol")); //conectando nosso sistema ao banco de dados chamado batePapoUol do Mongo

app.post('/participants', async (req, res) => {   //falta usar o joy e days aqui
    const {name} = req.body;
    try {
        if(!name) {
            return sendStatus(422)
        }
        await db.collection('participants').insertOne({name: name, lastStatus: Date.now()})
        await db.collection('message').insertOne({from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: 'HH:MM:SS'})
        res.sendStatus(201);
        } catch (error) {
        console.error(error);
        res.sendStatus(500);
        }
    });



app.listen(5000)


