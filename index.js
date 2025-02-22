const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const socketIo = require("socket.io");

// MongoDB URI
const uri =
  "mongodb+srv://hello:5M9y138b475fb2zl@cluster0.faqkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend origin
    methods: ["GET", "POST"], // Allow specific HTTP methods
  },
});

const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    return client.db("taskManager").collection("tasks"); // Use a single collection for tasks
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
}

// Get tasks collection
const tasksCollection = client.db("taskManager").collection("tasks");

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

    // Emit an event to notify clients about the new task
    io.emit("taskAdded", newTask);

    res.send(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to add task" });
  }
});

// Update task category
// Update task category in PUT endpoint and notify via WebSocket
// WebSocket connection and emit on task update
app.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const updatedTask = req.body; // Get the updated task data

    // Ensure taskId is a valid ObjectId
    const objectId = new ObjectId(taskId);

    // Update the task in the database
    const result = await tasksCollection.updateOne(
      { _id: objectId },
      { $set: { category: updatedTask.category } } // Update task category
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: "No changes made to the task" });
    }

    // Emit the task update event to all clients connected via WebSocket
    io.emit("taskUpdated", updatedTask);

    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// WebSocket Event Handling
io.on("connection", (socket) => {
  console.log("A user connected");

  // Emit all tasks to the new connection
  socket.on("getTasks", async () => {
    try {
      const tasks = await tasksCollection.find().toArray();
      socket.emit("tasks", tasks);
    } catch (error) {
      console.error("Error fetching tasks from DB", error);
      socket.emit("error", "Failed to fetch tasks");
    }
  });

  // Listen for task update events from the client
  socket.on("updateTask", async (updatedTask) => {
    try {
      const taskId = updatedTask._id;
      const objectId = new ObjectId(taskId);

      // Update the task category in the database
      await tasksCollection.updateOne(
        { _id: objectId },
        { $set: { category: updatedTask.category } }
      );

      // Emit the updated task to all clients
      io.emit("taskUpdated", updatedTask);
    } catch (error) {
      console.error("Error updating task", error);
      socket.emit("error", "Failed to update task");
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
