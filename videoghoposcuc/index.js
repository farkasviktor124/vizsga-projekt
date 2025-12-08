import express from "express";
import cors from "cors";


import userRoutes from "./routes/userRouter.js";

const app=express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use('/api', userRoutes);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});