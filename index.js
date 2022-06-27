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

async function updateParticipants() {
    try {
	    const participants = await db.collection('participants').find().toArray();
		for(let i=0;i<participants.length;i++){
            if((Date.now()-participants[i].lastStatus)>=10000){
                const message= {from: participants[i].name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format("HH:mm:ss")};
                await db.collection('message').insertOne(message);
                await db.collection('participants').deleteOne(participants[i]);
                
            }
        }	

	} catch (erro) {
        res.sendStatus(500)
	}    
}

setInterval(updateParticipants, 15000);

app.post('/participants', async (req, res) => {
    function verificandoNome(valor) {
        if(valor.length !== 0) {
            res.sendStatus(409)
            return
        }
    }
    const {name} = req.body;
    const promise = db.collection("participants").find({name}).toArray();
      promise.then((valor) => verificandoNome(valor));


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
console.log(user)
    const validation = messagesSchema.validate(req.body, {abortEarly: true})
    if(validation.error){
        res.sendStatus(422);
        return;
    }


    try{
        const newUser = await db.collection("participants").findOne({name : user})
        console.log(newUser)
        if(!newUser) {
            res.sendStatus(404)
            console.log("participante não está presente")
			return;
        }
        await db.collection('message').insertOne({from: user, to: to, text: text, type: type, time: time})
        res.sendStatus(201);
    } catch(erro) {
        res.sendStatus(500);
    }
})

app.get('/messages', async(req,res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;
    const everyMessage = await db.collection('message').find({$or: [{type: "message"}, {type: "status"}, {to: user}, {from: user}]}).toArray();
    const messagesPublic = everyMessage.slice(-limit)
    try{
        res.send(messagesPublic)
    } catch(erro){
        res.sendStatus(500);
    }
})
app.post('/status', async(req,res) => {
    const {user} = req.headers
     
    try{
        const newUser = await db.collection("participants").findOne({name : user})
        console.log(newUser)
        if(!newUser) {
            res.sendStatus(404)
			return;
        }

        await db.collection("participants").updateOne({ 
			name: newUser.name
		}, { $set:{"lastStatus": Date.now()}})
        res.sendStatus(200)
    } catch(erro) {
        res.sendStatus(500);
    }
})
app.listen(5000, () => {
    console.log('API está no ar!');
  });