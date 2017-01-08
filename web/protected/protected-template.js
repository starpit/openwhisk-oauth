/** format query string */
/** the query map from the URI */
const qs = window.location.search
      .split(/[&\?]/)
      .map(kv => kv.split("="))
      .reduce((M,kv)=> {M[kv[0]] = kv[1]; return M}, {})

const wrapItUp = (successMark, successMarkClass, successMessage) => {
    document.getElementById("success-mark").innerText = successMark
    document.getElementById("success-mark").setAttribute("class", successMarkClass)
    document.getElementById("success").innerText = successMessage
}

const doInvokeProtectedAction = inputValue => new Promise((resolve,reject) => {
    console.log("Invoking protected action")
    
    const authorization = JSON.parse(decodeURIComponent(qs.authorization))
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
	if (xhr.readyState == XMLHttpRequest.DONE) {
	    try {
		const response = JSON.parse(xhr.responseText)
		console.log("Response", xhr.responseText)
		
		if (response.error && response.error.statusCode === 401) {
		    reject("Not authorized")
		} else if (response.error || !response.message) {
		    console.error(response)
		    reject("Error in invocation")
		} else {
		    resolve(response)
		}
	    } catch (e) {
		reject(e)
	    }
	}
    }
    xhr.open("{ACTION_ENDPOINT_METHOD}",
	     `{ACTION_ENDPOINT}?provider=${authorization.provider}&access_token=${authorization.access_token}`,
	     true);
    xhr.send(JSON.stringify({ value: inputValue }))
})

const doLogin = () => window.location.href = `{LOGIN_ENDPOINT}?redirect_uri=${encodeURIComponent(window.location.href)}`

const init = () => !qs.authorization && !qs.authToken && doLogin()

const doSubmit = () => doInvokeProtectedAction(document.form.inputValue.value)
      .then(response => wrapItUp("\u2714", "success", response.message))
      .catch(err => wrapItUp("\u2715", "failure", `Invocation failed: ${err}`))
