import express from "express";
import serviceJobMappingController from "../controllers/serviceJobMappingController.js";

const serviceJobMappingRoute = express.Router();

serviceJobMappingRoute.get("/", serviceJobMappingController.get);
serviceJobMappingRoute.post("/", serviceJobMappingController.add);
serviceJobMappingRoute.delete("/", serviceJobMappingController.remove);

export default serviceJobMappingRoute;
