import express from "express";
import routes from "./routes";
import bodyParser from "body-parser";
import "dotenv/config";
import { App, createNodeMiddleware } from "@octokit/app";

// App
const app = express();

app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);


const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  webhooks: {
    secret: process.env.SECRET,
  },
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
});

async function handlePullRequestOpened({octokit, payload}) {
  console.log(`Received a pull request event for #${payload.pull_request.number}`);
  const messageForNewPRs = "Thanks for opening a new PR! Please follow our contributing guidelines to make your PR easier to review.";

  try {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: messageForNewPRs,
      headers: {
        "x-github-api-version": "2022-11-28",
      },
    });
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    }
    console.error(error)
  }
};

octokitApp.webhooks.on("pull_request.opened", handlePullRequestOpened)
octokitApp.webhooks.onAny((event) => {
  console.log(event)
})

app.use(
  createNodeMiddleware(octokitApp)
);

// Set port
const port: string | number = process.env.PORT || "1337";
app.set("port", port);

// app.use("/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
