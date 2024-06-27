import express from "express";
import routes from "./routes";
import bodyParser from "body-parser";
import "dotenv/config";
import { App, createNodeMiddleware } from "@octokit/app";
import fs from "fs";
import { Octokit } from "octokit";
import { handlePullRequestOpened, handleCommentCreated, handlePullRequestClosed, handleReviewerAssigned, handlePullRequestReviewed } from "./gitApi";


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

// pr opened
octokitApp.webhooks.on("pull_request.opened", handlePullRequestOpened)
octokitApp.webhooks.on("pull_request.reopened", handlePullRequestOpened)
// assigned a reviewer
octokitApp.webhooks.on("pull_request.review_requested", handleReviewerAssigned)
// commented
octokitApp.webhooks.on("pull_request_review_comment.created", handleCommentCreated)
octokitApp.webhooks.on("issue_comment.created", handleCommentCreated)
// reviewed
octokitApp.webhooks.on("pull_request_review.submitted", handlePullRequestReviewed)
// pr closed
octokitApp.webhooks.on("pull_request.closed", handlePullRequestClosed)
// other event
octokitApp.webhooks.onAny((event) => {
  console.log('received event:', event.name)
})

app.use(
  createNodeMiddleware(octokitApp)
);

// Set port
const port: string | number = process.env.PORT || "1337";
app.set("port", port);
app.set("path", process.env.PATH || "/webhooks");

app.use("/", routes);

// Server
app.listen(port, () => console.log(`Server running on localhost:${port}`));
