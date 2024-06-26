const express = require("express");
const { PrismaClient } = require("@prisma/client");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const {authenticateToken, generateToken} = require("./security");


const prisma = new PrismaClient();
const app = express();
const port = 3000;



app.use(express.json());

app.use((req, res, next) => {
  // console.log(req);
  console.log("Метод:", req.method, "Шлях:", req.url);
  next();
});

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
});

app.get("/status", (req, res) => {
  res.status(200).send("Сервер працює");
});

app.get("/users", authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  try {
    const users = await prisma.user.findMany();
    const usersSlice = users.slice(startIndex, endIndex);
    res.json(usersSlice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const user = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: { name, email },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/users/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: {
               id: parseInt(id),
        },
});
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/register", async (req, res) => {
    const { name, password, email } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                hashedPassword,
                email,
            }
        })
        
        res.status(200).send("User was created");
    } catch (err) {
        res.status(500).send("Error while creating a user");
    }       
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(401).send("No user found");
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);

        if (!isValid) {
            return res.status(401).send("Invalid password");
        }

        token = generateToken(user);

        res.status(200).send({message: "Login successful", token: token});
    } catch (err) {
        res.status(500).send("Login error");
        console.log(err);
    }
});

app.get("/profile", authenticateToken, async (req, res) => {
    if (req.user) {
        res.send(`Hi, ${req.user.username}`);
    } else {
        res.send("Please log in");
    }
});


app.post("/change_password", async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            }
        });

        if (!user) {
            return res.status(401).send("No user found");
        }

        const isValidPassword = await bcrypt.compare(oldPassword,user.hashedPassword);

        if (isValidPassword) {
            return res.status(401).send("Wrong password");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email: email },
            data: { hashedPassword: hashedPassword },
        })

        res.status(200).send("Password changed successful")
    } catch (err) {
        res.status(500).send("Something wrong with password");
    }
    
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
}

module.exports = app;
