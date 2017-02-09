function main(params) {
    if (params.state && params.state.redirect_uri) {
	const payload = {
	    code: 302,
	    headers: {
		location: params.state.redirect_uri
	    }
	}

	if (params.session_cookie) {
	    const cookie = {
		provider: params.provider,
		access_token: params.access_token,
		id: params.id,
		idRecord: params.idRecord
	    }
	    payload.headers["Set-Cookie"] = `${params.session_cookie}=${JSON.stringify(cookie)}; Expires=${new Date(new Date().getTime()+86409000).toUTCString()}; Path=/; Version=`
	}

        return payload
    } else {
	return params
    }
}
