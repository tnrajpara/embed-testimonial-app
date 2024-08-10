const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
// Enable CORS and serve static files from the public directory

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.static(path.join(__dirname, "public")));

// Open MongoDB connection once at server startup
client.connect().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/embed/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("ID is required");
  }

  try {
    const database = client.db("testimonial-db");
    const collection = database.collection("testimonial-data");
    const spaceData = await collection.find({ spaceId: id }).toArray();

    if (spaceData.length === 0) {
      return res.status(404).send("Space not found");
    }

    // Render dynamic HTML content based on the ID
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Embedded Testimonials</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="testimonials-container" class="testimonials-container">
  
          ${spaceData
            .map(
              (testimonial) => `
            <div class="testimonial">  
              <div class="testimonial-content">
                  <div className="testimonial-subheader">
                  <img src="${testimonial.photo}" alt="${
                testimonial.name
              }" id="user-profile" />
                <h3>${testimonial.name}</h3></div>
                <p>${testimonial.message}</p>

                  ${testimonial.attachments.map((attachment) => {
                    return `<img src="${attachment}" class="attachment" alt="${attachment.name}" />`;
                  })}
                 
                <p class="rating">${
                  "★".repeat(Math.round(testimonial.rating)) +
                  "☆".repeat(5 - Math.round(testimonial.rating))
                }</p>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred", error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
