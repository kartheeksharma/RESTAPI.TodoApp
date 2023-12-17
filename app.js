//Create a table todo in todoApplication.db through Sqlite3 CLI
//Type "sqlite3 todoApplication.db" in terminal
/*CREATE TABLE todo(id INTEGER, todo TEXT, priority TEXT, status TEXT);
  INSERT INTO todo(id, todo, priority,status)
  VALUES(1,"Learn HTML","HIGH","TO DO"),
  VALUES(2,"Learn JS","MEDIUM","DONE"),
  VALUES(3,"Learn CSS","LOW","DONE")

*/

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//1.List of all todo's whose status is TO DO
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//2.specific todo based on todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT *FROM todo 
                        WHERE id= ${todoId};`;
  const todoResp = await db.get(todoQuery);
  response.send(todoResp);
});

//3.create a todo in todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const todoCreate = `INSERT INTO 
                        todo(id, todo, priority,status)
                        VALUES(${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(todoCreate);
  response.send("Todo Successfully Added");
});

//4.Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const prevTodoQuery = `SELECT *FROM todo 
                        WHERE id= ${todoId};`;
  const prevTodoResp = await db.get(prevTodoQuery);

  const {
    todo = prevTodoResp.todo,
    priority = prevTodoResp.priority,
    status = prevTodoResp.status,
  } = request.body;

  const updateQuery = `UPDATE todo 
                        SET
                        todo='${todo}',
                        priority='${priority}',
                        status='${status}'
                        WHERE id= ${todoId};`;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//5.Delete a todo from todo table
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const delQuery = `DELETE FROM todo 
                        WHERE id=${todoId};`;
  await db.run(delQuery);
  response.send("Todo Deleted");
});

module.exports = app;
