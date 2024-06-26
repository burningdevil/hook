import restapi from 'rally';
import "dotenv/config";

const rally = restapi({
    apiKey: process.env.RALLY_API_KEY,
    apiVersion: 'v2.0',
    server: process.env.RALLY_URI,
})

const fields = ['Name', 'FormattedID', 'Owner', 'State', 'Ready', 'ScheduleState'];

const readDefect = async () => {
    return new Promise((resolve, reject) => {
        rally.get({
            ref: process.env.RALLY_OBJECT_REF,
            fetch: fields
        }, (err, res) => {
            if (err) {
                console.log(err);
                reject(err); // Reject the Promise if there's an error
            } else {
                console.log(res);
                resolve(res.Object); // Resolve the Promise with the desired value
            }
        });
    });
};

const updateOwner = async (ownerRef) => {
    rally.update({
        ref: process.env.RALLY_OBJECT_REF,
        data: {
            Owner: ownerRef
        },
        fetch: fields
    }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log(res)
        }
    })
}

const updateStatus = async (ready) => {
    rally.update({
        ref: process.env.RALLY_OBJECT_REF,
        data: {
            Ready: ready // true, false
        },
        fetch: fields
    }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log(res)
        }
    })
}

const updateState = async (state) => {
    rally.update({
        ref: process.env.RALLY_OBJECT_REF,
        data: {
            State: state // Open, Closed
        },
        fetch: fields
    }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log(res)
        }
    })
}

const updateScheduleStatus = async () => {
    rally.update({
        ref: process.env.RALLY_OBJECT_REF,
        data: {
            ScheduleState: 'Defined' // Defined, In-Progress, Completed, Accepted
        },
        fetch: fields
    }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log(res)
        }
    })
}

const __test__ = false
if (__test__) {
    const res = await readDefect()
    const owner = res.Owner._ref // https://rally1.rallydev.com/slm/webservice/v2.0/user/28129188684
    updateOwner(res.includes(process.env.RALLY_SE_REF) ? process.env.RALLY_QE_REF : process.env.RALLY_SE_REF)

    const status = res.Ready
    updateStatus(!status)
}

export {readDefect, updateOwner, updateStatus};