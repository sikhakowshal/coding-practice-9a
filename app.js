const express = require("express");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running on http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB ERROR : ${err.message}`);
    program.exit(1);
  }
};
initializeDbAndServer();

//API TO REGISTER USER
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}';
    `;
  const dbUser = await database.get(checkUserQuery);
  if (dbUser === undefined) {
    if (password.length > 5) {
      const createUserQuery = `
                INSERT INTO user (username, name, password, gender, location)
                VALUES (
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}' 
                );
            `;
      const dbResponse = await database.run(createUserQuery);
      const userId = dbResponse.lastID;
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API FOR USER LOGIN
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}';
    `;
  const dbUser = await database.get(checkUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCorrect === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

//API TO CHANGE PASSWORD
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const getUserQuery = `
        SELECT *
        FROM USER
        WHERE username = '${username}';
    `;
  const dbUser = await database.get(getUserQuery);
  const isPasswordCorrect = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordCorrect === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const changePasswordQuery = `
                UPDATE user
                SET password = '${hashedNewPassword}'
                WHERE username LIKE '${username}';
            `;
      await database.run(changePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
