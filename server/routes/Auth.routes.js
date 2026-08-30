import Router from "express";
import Signup from "../controllers/auth/Signup.controller.js";
import Login from "../controllers/auth/Login.controller.js";

const Authrouter = Router();

Authrouter.post("/signup" ,Signup );
Authrouter.post("/login" ,Login );


export default Authrouter;