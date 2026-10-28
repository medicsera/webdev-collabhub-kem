import {Router} from "express";
import {applyForProject} from "./application.controllers.js";

const router = Router();

router.post('/',applyForProject);

export default router;