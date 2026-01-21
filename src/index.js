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
import auth from '../src/middleware/authMiddleware.js'
import cors from 'cors'
import serviceJobRoute from './routes/serviceJobRoute.js'
import teamRoute from './routes/teamRoute.js'
import meRoute from './routes/meRoute.js'
import cookieParser from 'cookie-parser';
import partnerRoute from './routes/partnerRoute.js'
import serviceJobMappingRoute from './routes/serviceJobMappingRoute.js'
import serviceCriteriaRoute from './routes/serviceCriteriaRoute.js'
import partnerServiceJobRoute from './routes/partnerServiceJobRoute.js'
import contractServiceRoute from './routes/contractServiceRoute.js'
import contractServiceReviewRoute from './routes/contractServiceReviewRoute.js'
import debtPaymentRoute from './routes/debtPaymentRoute.js'
import roleRoute from './routes/roleRoute.js'
import referralRoute from './routes/referralRoute.js'
import jobReviewRoute from './routes/jobReviewRoute.js';
import serviceJobCriteriaRoute from './routes/serviceJobCriteriaRoute.js';
import acceptanceRoute from './routes/acceptanceRoute.js';
import quoteRoute from './routes/quoteRoute.js';
import notificationRoute from './routes/notificationRoute.js';
import businessFieldRoute from './routes/businessFieldRoute.js';

const app = express()
const port = process.env.PORT || 3000
// app.use(cors())
app.use(cors({
  origin: ["https://qlns-gui.vercel.app", "http://localhost:5173"],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth',authRoute)
app.use('/api/opportunity', auth, opportunityRoute)
app.use('/api/user',auth,userRoute)
app.use('/api/customer',auth,customerRoute)
app.use('/api/contract',auth,contractRoute)
app.use('/api/job',auth,jobRoute)
app.use('/api/debt',auth,debtRoute)
app.use('/api/service',auth, serviceRoute)
app.use('/api/project',auth, projectRoute)
app.use('/api/appendix',auth, contractAppendixRoute)
app.use('/api/service-job',auth, serviceJobRoute)
app.use('/api/team',auth, teamRoute)
app.use('/api/me',auth, meRoute)
app.use('/api/partner',auth, partnerRoute);
app.use('/api/service-job-mapping',auth, serviceJobMappingRoute);
app.use('/api/partner-service-job',auth, partnerServiceJobRoute);

app.use('/api/service-criteria',auth, serviceCriteriaRoute);
app.use('/api/contract-service', auth, contractServiceRoute);
app.use('/api/contract-service-review', auth, contractServiceReviewRoute);
app.use('/api/debt-payment', auth, debtPaymentRoute);
app.use('/api/role', auth, roleRoute);
app.use('/api/referral', auth, referralRoute);
app.use('/api/job-review',auth, jobReviewRoute);
app.use('/api/service-job-criteria',auth, serviceJobCriteriaRoute);
app.use('/api/acceptance',auth,  acceptanceRoute);
app.use('/api/quote',auth, quoteRoute );
app.use('/api/notification',auth, notificationRoute);
app.use('/api/business-fields',auth, businessFieldRoute);

app.get('/',(req, res) =>{
    res.status(200).send("Hello word")
})

app.listen( port, () => {
    console.log(`Server is running on ${port}`)
    console.log(new Date().toISOString());
})