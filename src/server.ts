import express from "express";
import routes from "./routes";
import bodyParser from "body-parser";
import "dotenv/config";
import { App, createNodeMiddleware } from "@octokit/app";
// import {  } from "octokit/webhooks";
import fs from "fs";
import { Octokit } from "octokit";

// App
const app = express();
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");

app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: privateKey,
  webhooks: {
    secret: process.env.SECRET,
  },
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  ...(enterpriseHostname && {
    Octokit: Octokit.defaults({
      baseUrl: `https://${enterpriseHostname}/api/v3`
    })
  })
});

const { data } = await octokitApp.octokit.request('/app')
const messageForNewPRs = "Thanks for opening a new PR! Please follow our contributing guidelines to make your PR easier to review.";

async function handlePullRequestOpened({octokit, payload}) {
  console.log(`Received a pull request event for #${payload.pull_request.number}`);
  

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
octokitApp.webhooks.on("pull_request.reopened", handlePullRequestOpened)
octokitApp.webhooks.onAny((event) => {
  console.log(event)
})

app.use(
  createNodeMiddleware(octokitApp)
);

// Set port
const port: string | number = process.env.PORT || "1337";
app.set("port", port);
app.set("path", process.env.PATH || "/webhooks");

// app.use("/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
