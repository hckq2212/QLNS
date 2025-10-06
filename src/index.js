import express from 'express'
import 'dotenv/config'
import  authRoute from './routes/authRoute.js'
import taskRoute  from './routes/taskRoute.js'
import userRoute  from './routes/userRoute.js'

const app = express()
app.use(express.json())
const port = process.env.PORT || 3000


app.use('/auth', authRoute)
app.use('/tasks', taskRoute)
app.use('/user',userRoute)

app.get('/',(req, res) =>{
    res.status(200).send("Hello word")
})

app.listen( port, ()=>{
    console.log(`Server is running on ${port}`)
})