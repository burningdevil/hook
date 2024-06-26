import { Octokit } from "@octokit/core";
import { readDefect } from "./rallyApi";
import { triggerEvent } from "./noveApi";

const stateMap = {
  0: {
    reviewers: 0,
    state: 'pending',
    owner: '',
  },
}

async function handlePullRequestOpened({octokit, payload}) {
  console.log(`Received a pull request event for #${payload.pull_request.number}`);
  const messageForNewPRs = "Thanks for opening a new PR! Please follow our contributing guidelines to make your PR easier to review.";

  try {
    stateMap[payload.pull_request.number] = {
      reviewers: 0,
      state: 'pending',
      owner: payload.pull_request.owner.login,
    }
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

async function handleReviewerAssigned({octokit, payload}) {
  const reviewer = payload.pull_request.requested_reviewers.slice(-1)[0].login;
  const html_url = payload.pull_request.html_url;
  // send msg to reviewer
  console.log('---------------')
  console.log(`Received a pull request event for #${payload.pull_request.number}`)
  console.log('Reviewer assigned:', reviewer)
  console.log('PR URL:', html_url)
  console.log('---------------')
}

async function handleCommentCreated({octokit, payload}) {
  const content = payload.comment.body;
  const sender = payload.comment.user.login;
  const sender_avatar = payload.comment.user.avatar_url;
  const link_url = payload.comment._links?.html
  const atted = content.match(/@[a-zA-Z0-9-]+/g); // ['@username', '@username2']

  if (atted?.length > 0 && stateMap[payload.pull_request?.number]?.reviewers > 1) {
    for (const user of atted) {
      // send msg to at ed user
    }
  }

  console.log('---------------')
  console.log(`Received a pull request event for #${payload.pull_request?.number}`);
  console.log('Comment:', content);
  console.log('sender:', sender);
  console.log('sender_avatar:', sender_avatar);
  console.log('link_url:', link_url);
  console.log('@ ed', atted);
  console.log('---------------')
}

async function handlePullRequestClosed({octokit, payload}) {
  const isMerge = payload.pull_request.merged;
  const mergedBy = payload.pull_request.merged_by?.login;

  if (isMerge) {
    stateMap[payload.pull_request.number].state = 'merged';
  }
  readDefect()
  console.log('---------------')
  console.log(`Received a pull request event for #${payload.pull_request?.number}`);
  console.log('Is merged:', isMerge);
  console.log('mergedBy:', mergedBy);
}

async function handlePullRequestReviewed({octokit, payload}) {
  const reviewer = payload.review.user.login;
  const state = payload.review.state; // approved
  
  if (state === 'approved') {
    // send msg to owner
    stateMap[payload.pull_request.number].reviewers += 1;
    if (stateMap[payload.pull_request.number].reviewers === 2) {
      stateMap[payload.pull_request.number].state = 'ready';
    }
  }

  console.log('---------------')
  console.log(`Received a pull request event for #${payload.pull_request.number}`)
  console.log('Reviewer:', reviewer)
  console.log('State:', state)
  console.log('---------------')
}

export { handlePullRequestOpened, handleReviewerAssigned, handleCommentCreated, handlePullRequestClosed, handlePullRequestReviewed };