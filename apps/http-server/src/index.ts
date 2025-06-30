import express from "express";
import { client } from "@repo/db/client";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hi there");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  const data = await client.user.create({
    data: {
      username,
      password,
    },
  });

  if (!data) {
    res.send("User signup faild.");
  }
  res.json({ message: "user signup successfull", DATA: data });
});

app.listen(3002, () => console.log("app is running on 3002"));
