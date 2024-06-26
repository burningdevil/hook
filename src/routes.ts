import express, { Request, Response, NextFunction } from "express";
import { verifyWebhookSignature } from "@hookdeck/sdk/webhooks/helpers";

import qs from "querystring";
import { IncomingHttpHeaders } from "http";
import { Request as ExpressRequest } from "express";
import { updateRally, updateRally2 } from "./rallyApi";
import { triggerEvent } from "./novuApi";
import { user2IdMap } from "./constant";
import bodyParser from "body-parser";

const SECRET: string = import.meta.env.VITE_HOOKDECK_SIGNING_SECRET || "1234abcd";

const router = express.Router();
router.use(bodyParser.json());

// interface RequestWithRawBody extends ExpressRequest {
//   rawBody: Buffer;
// }

if (!SECRET) {
  console.warn("No Hookdeck Signing Secret set!");
}
console.log({ SECRET });

const verifyHookdeckSignature = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction
) => {
  if (!SECRET) {
    console.warn(
      "No Hookdeck Signing Secret: Skipping webhook verification. Do not do this in production!"
    );
    return next();
  }

  const headers: { [key: string]: string } = {};
  const incomingHeaders = req.headers as IncomingHttpHeaders;

  for (const [key, value] of Object.entries(incomingHeaders)) {
    headers[key] = value as string;
  }

  console.log({ headers });

  const rawBody = req.rawBody.toString();
  console.log({ rawBody });
  const result = await verifyWebhookSignature({
    headers,
    rawBody,
    signingSecret: SECRET,
    config: {
      checkSourceVerification: false,
    },
  });

  if (!result.isValidSignature) {
    console.log("Signature is invalid, rejected");
    res.sendStatus(401);
  } else {
    console.log("Signature is valid, accepted");
    next();
  }
};

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Webhooks API");
});


router.post("/event", (req: Request, res: Response) => {
  console.log('-----------------')
  
  if (req.body.event === 'setReady') {
    updateRally2()
  } 
   else if (req.body.event === 'newpost') {
    // boardcast to all users
    for (let user in user2IdMap) {
      triggerEvent('new_post', user, {
        title: req.body.title ?? 'title',
        content: req.body.content ?? 'content',
      })
    }
  } else if (req.body.event === 'merge') {
    // repost merge event to user. Hard coded/
    triggerEvent('pull_request_ready_to_merge', req.body.owner, {
      type: 'merge',
      title: `Merge Request from Haocan Xu`,
      // TODO: update pr number
      content: req.body.content ?? 'PR #9: DE299101; update .gitignore',
    })
  } else {
    updateRally()
  }
  res.send("Received");
  console.log(`request body: ${req.body}`)
  console.log('-----------------')
});


// TEST
router.post(
  "/testing",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.headers);
    res.send("Tested");
  }
);

// PAYMENTS
router.post(
  "/stripe-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Stripe Successfully received Webhook request");
  }
);

router.post(
  "/paypal-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Paypal Successfully received Webhook request");
  }
);

router.post(
  "/paddle-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(qs.parse(decodeURIComponent((req.body as any).toString())));
    res.send("Paddle Successfully received Webhook request");
  }
);

router.post(
  "/checkout-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Checkout Successfully received Webhook request");
  }
);

// CI/CD
router.post(
  "/github-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("GitHub Successfully received Webhook request");
  }
);

router.post(
  "/gitlab-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Gitlab Successfully received Webhook request");
  }
);

router.post(
  "/bitbucket-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Bitbucket Successfully received Webhook request");
  }
);

router.post(
  "/docker-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Docker Successfully received Webhook request");
  }
);

// E-COMM
router.post(
  "/shopify-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Shopify Successfully received Webhook request");
  }
);

router.post(
  "/bigcommerce-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("BigCommerce Successfully received Webhook request");
  }
);

router.post(
  "/woocommerce-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("WooCommerce Successfully received Webhook request");
  }
);

router.post(
  "/commercelayer-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Commerce Layer Successfully received Webhook request");
  }
);

// CRM
router.post(
  "/hubspot-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("HubSpot Successfully received Webhook request");
  }
);

router.post(
  "/pipedrive-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Pipedrive Successfully received Webhook request");
  }
);

// EXTRAS
router.post(
  "/okta-webhooks-endpoint",
  verifyHookdeckSignature,
  (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Okta Event hook Successfully received");
  }
);

export default router;
