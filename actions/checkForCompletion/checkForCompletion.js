
function main(state) {
    const ow = require('openwhisk')({
	apihost: process.env['__OW_API_HOST'],
	api_key: process.env['__OW_API_KEY']
    })
    
    const pollForCompletion = (tid, since) => new Promise((resolve, reject) => {
	// console.log('Polling initiated', since)
	
	const waitForThisAction = 'login'

	const pollOnce = iter => {
	    try {
		// console.log('Polling once', iter)

		if (iter > 25) {
 		    reject({ status: 'error', reason: 'timeout' })
		}

		ow.activations.list({ limit: 5, name: waitForThisAction, since: since, docs: true }).then(list => {
		    // console.log('Poll list', list.length)
		
		    for (var i = 0; i < list.length; i++) {
			var activationDetails = list[i]

			if (activationDetails.response.result.tid === tid) {

			    delete activationDetails.response.result.tid
			    // console.log(activationDetails.response.result)
			    
			    // all done
			    return resolve(activationDetails.response.result)
			}
		    }

		    const sleepInterval = 
			  iter >= 50 ? 3000
			  : iter >= 10 ? 1000
			  : iter >= 5 ? 200
			  : 100

		    setTimeout(() => pollOnce(iter + 1), sleepInterval)
		}).catch(err => {console.error(err); reject(err)})

	    } catch (e) {
		return reject(e)
	    }
	}
	
	pollOnce(0)
    })

    // console.log('Looking for this TID', state.tid)
    
    return ow.activations.list({ limit: 1, docs: true })
	.then(lastOne => pollForCompletion(state.tid, lastOne[0].end))
}
