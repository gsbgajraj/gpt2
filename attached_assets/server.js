// const express = require("express");
// const axios = require("axios");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(express.json());
// app.use(cors());

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// async function fetchChatResponse(message, retries = 3, delay = 2000) {
//     try {
//         const response = await axios.post(
//             "https://api.openai.com/v1/chat/completions",
//             {
//                 model: "gpt-3.5-turbo",
//                 messages: [{ role: "user", content: message }],
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${OPENAI_API_KEY}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );
//         return response.data.choices[0].message.content;
//     } catch (error) {
//         if (error.response && error.response.status === 429 && retries > 0) {
//             console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
//             await new Promise(res => setTimeout(res, delay)); // Wait before retrying
//             return fetchChatResponse(message, retries - 1, delay * 2); // Exponential backoff
//         }
//         throw error;
//     }
// }

// app.post("/chat", async (req, res) => {
//     try {
//         const { message } = req.body;
        
//         if (!message) {
//             return res.status(400).json({ error: "Message is required" });
//         }

//         const chatResponse = await fetchChatResponse(message);
//         res.json({ response: chatResponse });
//     } catch (error) {
//         console.error("Error fetching response from ChatGPT:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });



const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY in environment variables.");
    process.exit(1);
}

async function fetchChatResponse(message, retries = 3, delay = 2000) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: message }],
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const chatMessage = response.data?.choices?.[0]?.message?.content;
        if (!chatMessage) {
            throw new Error("Invalid response from OpenAI API");
        }
        return chatMessage;
    } catch (error) {
        if (error.response) {
            console.error(`Error ${error.response.status}: ${error.response.data.error?.message || error.message}`);
        } else {
            console.error("Axios request failed:", error.message);
        }
        if (error.response?.status === 429 && retries > 0) {
            console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
            await new Promise((res) => setTimeout(res, delay));
            return fetchChatResponse(message, retries - 1, delay * 2);
        }
        throw error;
    }
}

app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Invalid or missing 'message' field" });
        }
        const chatResponse = await fetchChatResponse(message);
        res.json({ response: chatResponse });
    } catch (error) {
        console.error("Error fetching response from ChatGPT:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/", (req,res)=>{
    res.send("Hello World");
})

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
