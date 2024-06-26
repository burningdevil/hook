// https://docs.novu.co/api-reference/events/trigger-event

import { Novu } from "@novu/node";

const novu = new Novu('api_key');

export const triggerEvent = async () => {
    await novu.trigger('event_name', {
        to: {
            subscriberId: 'subscriber_id',
        },
        payload: {
            key: 'value'
        }
    })
}
