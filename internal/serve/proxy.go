package serve

import (
	"net/http"
	"net/http/httputil"
	"net/url"
)

func (s *Server) apiProxy() http.Handler {
	target, _ := url.Parse(s.apiBaseURL)

	proxy := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = target.Scheme
			req.URL.Host = target.Host
			req.Host = target.Host
		},
	}

	return proxy
}
