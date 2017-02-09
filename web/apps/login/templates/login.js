var OpenWhiskOauth = (function() {
    const providers = {PROVIDERS}

    /** uuid generator */
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000)
	  .toString(16)
	  .substring(1)
    const guid = () => s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	  s4() + '-' + s4() + s4() + s4()

    const endpoint = providerName => {
	const provider = providers[providerName]
	if (!provider) {
	    return console.error('Unsupported auth provider', providerName)
	}

	//
	// this state object will be passed, by the identity provider,
	// back to the server-side action
	//
	// we tag a random transaction id, so that we can fetch the
	// server-side response
	//
	const state = {
	    providerName: providerName
	}

	// if we were asked to redirect on completion, do so now
	if (window.location.search) {
		const key = 'redirect_uri='
		const idx = window.location.search.indexOf(key)
		if (idx >= 0) {
		    const start = idx + key.length
		    const end = window.location.search.indexOf('&')
		    const redirect = window.location.search.substring(start, end == -1 ? window.location.search.length : end)
		    const payload = ''
		    state.redirect_uri = decodeURIComponent(`${redirect}${payload}`)
		}
	    }
	
	//
	// format the url that we use to communicate with the identity
	// provider
	//
	const endpoint = `${provider.authorization_endpoint}?client_id=${encodeURIComponent(provider.credentials.client_id)}&redirect_uri=${encodeURIComponent('{LOGIN_ENDPOINT}')}&state=${encodeURIComponent(JSON.stringify(state))}${provider.authorization_endpoint_query||''}`

	return {
	    providerName: providerName,
	    endpoint: endpoint
	}
    }

    const openAndPollForCompletion = ep => click_evt => {
	const currentSelection = document.querySelector('#providers .selected')
	if (currentSelection === click_evt.currentTarget) return
	
	if (currentSelection) currentSelection.setAttribute('class', currentSelection.getAttribute('class').replace(/selected/, ''))
	click_evt.currentTarget.setAttribute('class', `${click_evt.currentTarget.getAttribute('class')} selected`)
	document.getElementById('providers').setAttribute('class', `${document.getElementById('providers').getAttribute('class')} something-selected`)

	window.location.href = ep.endpoint
	return

	const openedWindow = window.open(ep.endpoint)

	/**
	 * The authentication backend is done, finish things up
	 *
	 */
	const wrapItUp = (successMark, successMarkClass, successMessage, authorization) => {
	    // decorate this page
	    document.getElementById('success-mark').innerText = successMark
	    document.getElementById('success-mark').setAttribute('class', successMarkClass)
	    document.getElementById('success').innerText = successMessage

	    // close the window that we opened to negotiate with the provider
	    openedWindow.close()


	}

	const waitForCompletion = () => {
	    const xhr = new XMLHttpRequest();
	    xhr.onload = () => {
		if (xhr.status === 200) {
		    const authorization = JSON.parse(xhr.responseText)
		    wrapItUp('\u2714', 'success', 'Successfully logged on!', authorization)
		} else {
		    console.error(xhr.responseText)
		    wrapItUp('\u2715', 'failure', 'Failed to logged on')
		}
	    }
	    xhr.open('POST', '{CHECK_FOR_COMPLETION_ENDPOINT}')
	    xhr.send(JSON.stringify(ep))
	}
	waitForCompletion()
    }

    const self = {}
    
    self.initProviderListView = (containerID, templateID) => {
        const container = document.getElementById(containerID)
        const template = document.getElementById(templateID)

        for (var providerName in providers) {
	    const ep = endpoint(providerName)

	    const dom = template.cloneNode(true)
	    dom.id = ''
	    dom.setAttribute('class', `${dom.getAttribute('class')} ${providerName.toLowerCase()}`)
	    container.appendChild(dom)
	    dom.querySelector('.provider-name').innerText = providerName
	    dom.querySelector('.bx--btn').onclick = openAndPollForCompletion(ep)
	}
    }

    return self
})()
