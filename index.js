const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

// MongoDB URI
const uri =
  "mongodb+srv://hello:5M9y138b475fb2zl@cluster0.faqkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create Express app
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectDB() {
  await client.connect();
  return client.db("taskManager").collection("tasks");
}
const tasksCollection = client.db("tasksCollection").collection("Task");

// CRUD Operations

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await tasksCollection.find().toArray();
    res.send(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tasks" });
  }
});

// Add a task
app.post("/tasks", async (req, res) => {
  try {
    const newTask = req.body; // assuming body contains { title, description, category }
    const result = await tasksCollection.insertOne(newTask);
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to add task" });
  }
});

// Update task
// app.put("/tasks/:id", async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const tasksCollection = await connectDB();
//     const updatedTask = req.body; // assuming body contains updated fields like { title, description, category }
//     const result = await tasksCollection.updateOne(
//       { _id: taskId },
//       { $set: updatedTask }
//     );
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to update task" });
//   }
// });

// Delete task
// app.delete("/tasks/:id", async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const tasksCollection = await connectDB();
//     const result = await tasksCollection.deleteOne({ _id: taskId });
//     res.status(204).json(result);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete task" });
//   }
// });

app.get("/", (req, res) => {
  res.json({ message: "API is working" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
