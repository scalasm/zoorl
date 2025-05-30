## How to call the API

Once you have deployed the stack, an URL will be shown that you can use to invoke the REST API hello world endpoint:

```bash
...
...
✨  Deployment time: 57.59s

Outputs:
ZoorlPersonalStack.apiEndpoint9349E63C = https://63ptgn7l69.execute-api.eu-west-1.amazonaws.com/dev/
ZoorlPersonalStack.apiUrl = https://63ptgn7l69.execute-api.eu-west-1.amazonaws.com/dev/
Stack ARN:
arn:aws:cloudformation:eu-west-1:959713430052:stack/ZoorlPersonalStack/8acd6280-3a61-11f0-9544-0284a0b5329b

✨  Total time: 159.12s
```

```bash
export API_URL="https://63ptgn7l69.execute-api.eu-west-1.amazonaws.com/dev/"
export API_KEY ="<api key you get from below>"
curl -X POST $API_URL/u \
     -H "Content-Type: application/json" \
     -d '{"url":"https://docs.powertools.aws.dev/lambda/python/latest/", "ttl": 300}'

{"message":"Hello, Mario"}
```


```bash
export API_URL=""

```