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
const messagesSchema = joi.object({
    to : joi.string().min(1).required(),
    text : joi.string().min(1).required(),
    type : joi.string().valid('message','private_message').required()
})
/*const userSchema = joi.object({
    to : joi.
})*/

app.post('/participants', async (req, res) => {   //falta usar o joy e days aqui
    const {name} = req.body;
    console.log(name)
    const promise = db.collection("participants").find({name}).toArray();
/*Verificar se ainda existe usuário com esse nome presente */

    const validation = participantsSchema.validate(req.body, {abortEarly: true})
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

app.post('/messages', async(req,res) => {
    const {to, text, type} = req.body
    const {user} = req.headers

    const validation = messagesSchema.validate(req.body, {abortEarly: true})
    if(validation.error){
        res.sendStatus(422);
        return;
    }
/*Verificar se ainda existe usuário com esse nome presente */
    const newUser = await db.collection("participants").find({name : user}).toArray();

    try{
        await db.collection('message').insertOne({from: user, to: to, text: text, type: type, time: time})
        res.sendStatus(201);
    } catch(erro) {
        res.sendStatus(500);
    }
})

app.get('/messages', async(req,res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;
    console.log(user)
    const messagesPublic = await db.collection('message').find({to: { $in: [ "Todos", user ] }}).limit(limit).toArray();
    try{
        res.send(messagesPublic)
    } catch(erro){
        res.sendStatus(500);
    }
})
 
app.listen(5000, () => {
    console.log('API está no ar!');
  });