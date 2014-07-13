package eval

import (
    "net/http"
    "net/url"
    "log"
    "encoding/json"
    "io"
)

type Binding map[string]string

func ExecuteQuery(endpoint string, query string) io.ReadCloser {
    q := endpoint + "?format=application/json&query=" + url.QueryEscape(query)
    log.Printf("Execute request: [%s]", q)
    resp, err := http.Get(q)
    if err != nil {
        log.Fatal(err)
    }
    return resp.Body
}

func GetBindings(body io.ReadCloser) []map[string]Binding {
    dec := json.NewDecoder(body)
    var res = new(struct{Results struct{Bindings []map[string]Binding}})
    if err := dec.Decode(&res); err != nil {
        log.Fatal(err)
    }
    return res.Results.Bindings
}

func Ask(body io.ReadCloser) bool {
    dec := json.NewDecoder(body)
    var res = new(struct{Boolean bool})
    if err := dec.Decode(&res); err != nil {
        log.Fatal(err)
    }
    return res.Boolean
}

