import  express from 'express'
import 'dotenv/config'
const Port =5001
import cors from 'cors'
import  {errorMiddleware}  from './src/middleware/error.middleware.js';
import router from './src/routes/index.routes.js';
import { connectDb } from './src/utils/helper.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as useragent from "express-useragent";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(useragent.express());
app.use(express.json())
app.set("trust proxy", true);
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
 app.get('/set-account', (req,res)=>{
  console.log("XXXXXXXXXXX", path)
  res.sendFile(path.join(__dirname,"../public",'createAccount.html'))
 
})

app.use('/api', router);
app.use(errorMiddleware);

connectDb()
  .then(() => {
    console.log("Database Connected.");
  })
  .catch((error) => {
    console.log(error, "connection error");
  });
app.listen(Port, ()=>{
    console.log(`Server is listning on Port ${Port} `)
})
