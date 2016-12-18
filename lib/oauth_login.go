package main

import (
	"os"
	"fmt"
	"bytes"
	"runtime"
	"os/exec"
	"net/url"
	"net/http"
	"io/ioutil"
	"encoding/json"
)

// change this to whatever we decide to use for the controller route
const backendURI = "http://localhost:10014/oauth/v1/authenticate";

// DO NOT CHANGE THIS, without also changing the oauth application registrations
const redirectPort = 15231;

type ProvidersType map[string]ProviderType
type ProviderType struct {
	Authorization_endpoint string
	Authorization_endpoint_query map[string]string
	Credentials CredentialsType
}
type CredentialsType struct {
	Client_id string
}

func sendFile(f string, res http.ResponseWriter, req *http.Request) {
	http.ServeFile(res, req, f)
}

func allBad(res http.ResponseWriter, req *http.Request) {
	http.Redirect(res, req, "../public/404.html", 301)
}

func allGood(res http.ResponseWriter, req *http.Request) {
	http.Redirect(res, req, "../public/logged_in.html", 301)
}

func onCodeCallback(providerName string) func (res http.ResponseWriter, req *http.Request) {
	return func(res http.ResponseWriter, req *http.Request) {
		//
		// cool, we should now have an oauth code
		//
		var query = req.URL.Query()

		if codes, ok := query["code"]; ok {
			//
			// pass this code to the backend, and get back an auth_key
			//
			var code = codes[0]
			var jsonStr = fmt.Sprintf("{\"code\": \"%s\", \"provider\": \"%s\"}", code, providerName)
			fmt.Printf("ZOOO %s\n", jsonStr)
			var jsonBytes = []byte(jsonStr)
			req, err := http.NewRequest("POST", backendURI, bytes.NewBuffer(jsonBytes))
			req.Header.Set("Content-Type", "application/json")
			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				fmt.Printf("All bad %s\n", err);
				allBad(res, req);
				return;
			}
			defer resp.Body.Close()

			//body, _ := ioutil.ReadAll(resp.Body)
			if resp.StatusCode != 200 {
				fmt.Printf("All bad %s\n", resp.Status)
				allBad(res, req)
			} else {
				//
				// we should now have an auth_key
				//
				fmt.Printf("All good\n")
				allGood(res, req)
			}
		} else {
			//
			// then we're just serving up a static file
			//
			fmt.Printf("Sending %v", req.URL.Path)
			sendFile(req.URL.Path, res, req)
		}
	}
}

// open opens the specified URL in the default browser of the user.
func open(Url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, Url)
	return exec.Command(cmd, args...).Start()
}

func doLoginWithProvider(providerName string, provider ProviderType) bool {
	//
	// oauth requires that we use a browser to accept the user's
	// credentials, and that we service a redirect_uri that the identity
	// provider will call with the oauth code (this code is a partial
	// assurance that the user is who they claim to be; the rest of the
	// oauth handshake must be handled on the backend, in order to avoid
	// exposing any of our oauth application secrets to the client)
	//
	http.HandleFunc("/", onCodeCallback(providerName));
	defer http.ListenAndServe(fmt.Sprintf(":%d", redirectPort), nil);

	//
	// when the server is up, we are ready to open up a browser so
	// that the user can start the login process
	//
	// what happens here: we open the browser to the provider's
	// authorization endpoint, specifying a redirect_uri that points
	// back to the server we just started up; the provider will call
	// us back with the oauth code
	//
	var Url *url.URL
	Url, err := url.Parse(provider.Authorization_endpoint)
	if err != nil {
		return false
	}

	parameters := url.Values{}
	parameters.Add("client_id", provider.Credentials.Client_id)
	parameters.Add("redirect_uri", fmt.Sprintf("http://localhost:%d", redirectPort))
	for k,v := range provider.Authorization_endpoint_query {
		parameters.Add(k,v)
	}
	Url.RawQuery = parameters.Encode()
	
	open(Url.String());
	return true
} /* end of doLoginWithProvider */

func doLoginWithProviderName(providerName string) {
	file, e := ioutil.ReadFile("../conf/providers-client.json")
	if e != nil {
		fmt.Printf("File error: %v\n", e)
		//os.Exit(1)
		return
	}
	var providers ProvidersType
	json.Unmarshal(file, &providers)

	// fmt.Print(providers)
	
	if provider, ok := providers[providerName]; ok {
		doLoginWithProvider(providerName, provider)

	} else {
		fmt.Printf("Unsupported auth provider %s\n", providerName);
	}

}

func main() {
	var providerName = os.Args[1]
	fmt.Printf("Using this provider: %s\n", providerName)
	doLoginWithProviderName(providerName)
}
