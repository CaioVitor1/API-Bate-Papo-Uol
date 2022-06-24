import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi';
import dayjs from "dayjs"

dotenv.config();
let time = dayjs().format("HH:mm:ss")
console.log(time)
//configurações express
const app = express();
app.use(cors());
app.use(express.json());
//configurações mongodb
let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI); 
const promise = mongoClient.connect();
promise.then(() => db = mongoClient.db("batePapoUol")); //conectando nosso sistema ao banco de dados chamado batePapoUol do Mongo

const participantsSchema = joi.object({
    name: joi.string().required()
})


app.post('/participants', async (req, res) => {   //falta usar o joy e days aqui
    const name = req.body;

    const validation = participantsSchema.validate(name, {abortEarly: true})
    if(validation.error){
        res.sendStatus(422);
        return;
    }

    try {
        await db.collection('participants').insertOne({name: name, lastStatus: Date.now()})
        await db.collection('message').insertOne({from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time})
        res.sendStatus(201);
        } catch (error) {
        console.error(error);
        res.sendStatus(500);
        }
    });
app.get('/participants', async(req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.send(participants);
      } catch (error) {
        console.error(error);
        res.sendStatus(500);
      }
}
)


app.listen(5000, () => {
    console.log('API está no ar!');
  });