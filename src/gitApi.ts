import { Octokit } from "@octokit/core";
import { updateRally } from "./rallyApi";
import { triggerEvent } from "./novuApi";

const stateMap = {
  0: {
    reviewers: 0,
    state: 'pending',
    owner: '',
  },
}
let lastHandledTimestamp = 0;
 
const getNumber = (payload) => {
  return payload.pull_request?.number ?? 0
}

async function handlePullRequestOpened({octokit, payload}) {
  console.log(`Received a pull request event for #${getNumber(payload)}`);
  const messageForNewPRs = "Thanks for opening a new PR! Please follow our contributing guidelines to make your PR easier to review.";

  try {
    stateMap[getNumber(payload)] = {
      reviewers: 0,
      state: 'pending',
      owner: payload.repository.owner.login,
    }
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: getNumber(payload),
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
  const currentTime = Date.now();
  
  // Check if the current request is at least 3 seconds after the last one
  if (currentTime - lastHandledTimestamp < 3000 && lastHandledTimestamp !== 0) {
    console.log('Request ignored to avoid handling 2 requests in less than 3 seconds.');
    return; // Exit the function early
  }
  
  // Update the timestamp of the last handled request
  lastHandledTimestamp = currentTime;
  const reviewer = payload.pull_request.requested_reviewers.slice(-1)[0].login;
  const html_url = payload.pull_request.html_url;
  // send msg to reviewer
  triggerEvent('pull_request_reviewer', reviewer, {
    type: 'review',
    url: html_url,
    from: payload.pull_request.user.login || payload.repository.owner.login,
    to: reviewer,
    title: `PR #${getNumber(payload)} Assigned`,
    content: `You have been assigned as a reviewer for this PR. Please review it as soon as possible.`
  })
  console.log('---------------')
  console.log(`Received a pull request event for #${getNumber(payload)}`)
  console.log('Reviewer assigned:', reviewer)
  console.log('PR URL:', html_url)
  console.log('---------------')
}

async function handleCommentCreated({octokit, payload}) {
  const currentTime = Date.now();
  
  // Check if the current request is at least 3 seconds after the last one
  if (currentTime - lastHandledTimestamp < 3000 && lastHandledTimestamp !== 0) {
    console.log('Request ignored to avoid handling 2 requests in less than 3 seconds.');
    return; // Exit the function early
  }
  
  // Update the timestamp of the last handled request
  lastHandledTimestamp = currentTime;
  const content = payload.comment.body;
  const sender = payload.comment.user.login;
  const sender_avatar = payload.comment.user.avatar_url;
  const link_url = payload.comment._links?.html || payload.comment.html_url;
  const atted = content.match(/@[a-zA-Z0-9-]+/g); // ['@username', '@username2']

  if (atted?.length > 0) { //&& stateMap[payload.pull_request?.number]?.reviewers > 1) {
    for (const user of atted) {
      // send msg to at ed user
      triggerEvent('pull_request_comment', user.slice(1), {
        type: 'comment',
        from: sender,
        to: user,
        url: link_url,
        title: `Comment on PR #${getNumber(payload)}`,
        content: content,
      })
    }
  }

  console.log('---------------')
  console.log(`Received a pull request event for #${getNumber(payload)}`);
  console.log('Comment:', content);
  console.log('sender:', sender);
  console.log('sender_avatar:', sender_avatar);
  console.log('link_url:', link_url);
  console.log('@ ed', atted);
  console.log('---------------')
}

async function handlePullRequestClosed({octokit, payload}) {
  const currentTime = Date.now();
  
  // Check if the current request is at least 3 seconds after the last one
  if (currentTime - lastHandledTimestamp < 3000 && lastHandledTimestamp !== 0) {
    console.log('Request ignored to avoid handling 2 requests in less than 3 seconds.');
    return; // Exit the function early
  }
  
  // Update the timestamp of the last handled request
  lastHandledTimestamp = currentTime;
  const isMerge = payload.pull_request.merged;
  const mergedBy = payload.pull_request.merged_by?.login;

  // if (isMerge) {
  //   stateMap[payload.pull_request.number].state = 'merged';
  // } else {
  //   stateMap[payload.pull_request.number].state = 'closed';
  // }

  triggerEvent('pull_request_merged', payload.repository.owner.login, {
    type: 'rally',
    from: payload.pull_request.user.login || payload.repository.owner.login,
    to: payload.pull_request.user.login,
    url: payload.repository.html_url,
    title: `PR #${getNumber(payload)} ${isMerge ? 'Merged' : 'Closed'}`,
    content: `Your PR has been ${isMerge ? 'merged' : 'closed'} by ${payload.sender.login}.\r\n Will you update the Rally ${process.env.RALLY_OBJECT_NAME} Status?`,
  })
  // updateRally()

  console.log('---------------')
  console.log(`Received a pull request event for #${getNumber(payload)}`);
  console.log('Is merged:', isMerge);
  console.log('mergedBy:', mergedBy);
}

async function handlePullRequestReviewed({octokit, payload}) {
  const currentTime = Date.now();
  
  // Check if the current request is at least 3 seconds after the last one
  if (currentTime - lastHandledTimestamp < 3000 && lastHandledTimestamp !== 0) {
    console.log('Request ignored to avoid handling 2 requests in less than 3 seconds.');
    return; // Exit the function early
  }
  
  // Update the timestamp of the last handled request
  lastHandledTimestamp = currentTime;
  const reviewer = payload.review.user.login;
  const state = payload.review.state; // approved
  
  if (state === 'approved') {
    // send msg to owner  
    stateMap[getNumber(payload)].reviewers += 1;
    const owner = payload.repository.owner.login
    if (stateMap[getNumber(payload)].reviewers === 2) {
      // stateMap[payload.pull_request.number].state = 'ready';
      triggerEvent('pull_request_reviewed', owner, {
        type: 'approved',
        from: reviewer,
        to: owner,
        title: `PR #${getNumber(payload)} Ready to merge.`,
        content: `Your PR has been apprvoed by ${reviewer} and ready to merge.`,
      })
    } else {
      // triggerEvent('pull_request_reviewed', owner, {
      //   type: 'approved',
      //   from: reviewer,
      //   to: owner,
      //   title: `PR #${getNumber(payload)} Approved.`,
      //   content: `Your PR has been apprvoed by ${reviewer}.`,
      // })
    }
  }

  console.log('---------------')
  console.log(`Received a pull request event for #${getNumber(payload)}`)
  console.log('Reviewer:', reviewer)
  console.log('State:', state)
  console.log('---------------')
}

export { handlePullRequestOpened, handleReviewerAssigned, handleCommentCreated, handlePullRequestClosed, handlePullRequestReviewed };