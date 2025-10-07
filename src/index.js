import express from 'express'
import 'dotenv/config'
import  authRoute from './routes/authRoute.js'
import opportunityRoute  from './routes/opportunityRoute.js'
import userRoute  from './routes/userRoute.js'
import customerRoute from './routes/customerRoute.js'
import contractRoute from './routes/contractRoute.js'
import jobRoute from './routes/jobRoute.js'
import debtRoute from './routes/debtRoute.js'

const app = express()
app.use(express.json())
const port = process.env.PORT || 3000


app.use('/auth', authRoute)
app.use('/opportunity', opportunityRoute)
app.use('/user',userRoute)
app.use('/customer',customerRoute)
app.use('/contract',contractRoute)
app.use('/job',jobRoute)
app.use('/debt',debtRoute)

app.get('/',(req, res) =>{
    res.status(200).send("Hello word")
})

app.listen( port, ()=>{
    console.log(`Server is running on ${port}`)
})