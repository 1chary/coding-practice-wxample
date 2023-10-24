const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const app = express();

const db_path = path.join(__dirname, "userData.db");
app.use(express.json());

let db = null;

const initializeTheDatabase = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeTheDatabase();

// Register for new user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashed_password = await bcrypt.hash(request.body.password, 10);
  const userDetails = `
  SELECT *
  FROM user
  WHERE username = '${username}'
  `;
  const info = await db.run(userDetails);

  if (info === undefined) {
    const enter_user_details = `
        INSERT INTO user(username , name, password , gender , location)
        VALUES 
            '${username}',
            '${name}',
            '${hashed_password}',
            '${gender}',
            '${location}'
        `;
    const passwordLength = password.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password too short");
    } else {
      const entered = await db.run(enter_user_details);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// Log In the new user
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserDetails = `
    SELECT *
    FROM user
    WHERE username = '${username}'
    `;
  const validate = db.get(checkUserDetails);
  if (validate === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, info.password);
    if (checkPassword === true) {
      response.status(200);
      response.send("Login success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// change password:
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUser = `
    SELECT *
    FROM user
    WHERE username = '${username}'
    `;
  const dbResponse = db.get(checkUser);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const validatePassword = await bcrypt.compare(oldPassword, info.password);
    if (validatePassword === true) {
      const newPasswordLength = newPassword.length;
      if (newPasswordLength < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedNewPassword = await bcrypt.hash(newPassword, 10);
        const setNewPassword = `
                UPDATE user
                SET password = '${encryptedNewPassword}'
                WHERE username = '${username}'
                `;
        await db.run(setNewPassword);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current user");
    }
  }
});

module.exports = app;
