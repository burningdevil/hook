// https://docs.novu.co/api-reference/events/trigger-event

import { Novu } from "@novu/node";
import "dotenv/config";
import { convertNames, user2IdMap } from "./constant";

const novu = new Novu(process.env.NOVU_API_KEY, {backendUrl: process.env.NOVU_BACKEND_URL});
console.log('novu created', novu)


export const triggerEvent = async (event, to, payload) => {
    // transform users
    let subscriber_id = user2IdMap[to] ?? to
    try {
        const res = await novu.trigger(process.env.NOVU_WORKFLOW_ID, {
            to: {
                subscriberId: subscriber_id
            },
            payload: {
                ...payload,
                content: convertNames(payload.content ?? ''),
                title: convertNames(payload.title ?? '')
            }
        })
        console.log('-----------')
        console.log('send a event to notify ', to)
        console.log('result: ', res)
        console.log('-----------')
    } catch (e) {
        console.log(e)
    }
}
