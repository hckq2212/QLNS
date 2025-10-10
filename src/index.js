import express from 'express'
import 'dotenv/config'
import  authRoute from './routes/authRoute.js'
import opportunityRoute  from './routes/opportunityRoute.js'
import userRoute  from './routes/userRoute.js'
import customerRoute from './routes/customerRoute.js'
import contractRoute from './routes/contractRoute.js'
import jobRoute from './routes/jobRoute.js'
import debtRoute from './routes/debtRoute.js'
import serviceRoute from './routes/serviceRoute.js'
import projectRoute from './routes/projectRoute.js'
import contractAppendixRoute from './routes/contractAppendixRoute.js'
import debtPaymentController from './controllers/debtPaymentController.js'
import auth from '../src/middleware/authMiddleware.js'

const app = express()
app.use(express.json())
const port = process.env.PORT || 3000


app.use('/api/auth', authRoute)
app.use('/api/api/opportunity',auth, opportunityRoute)
app.use('/api/user',auth,userRoute)
app.use('/api/customer',auth,customerRoute)
app.use('/api/contract',auth,contractRoute)
app.use('/api/job',auth,jobRoute)
app.use('/api/debt',auth,debtRoute)
app.use('/api/service',auth, serviceRoute)
app.use('/api/project',auth, projectRoute)
app.use('/api/appendix',auth, contractAppendixRoute)



app.get('/',(req, res) =>{
    res.status(200).send("Hello word")
})

app.listen( port, ()=>{
    console.log(`Server is running on ${port}`)
})