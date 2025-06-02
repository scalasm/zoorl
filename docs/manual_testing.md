## How to call the API

Once you have deployed the stack, an URL will be shown that you can use to invoke the REST API hello world endpoint:

```bash
...
...
 ✅  ZoorlPersonalStack

✨  Deployment time: 301s

Outputs:
ZoorlPersonalStack.apiEndpoint9349E63C = https://4xnhiok2nh.execute-api.eu-west-1.amazonaws.com/v1/
ZoorlPersonalStack.apiUrl = https://4xnhiok2nh.execute-api.eu-west-1.amazonaws.com/v1/
Stack ARN:
arn:aws:cloudformation:eu-west-1:959713430052:stack/ZoorlPersonalStack/d4bc2690-3fe0-11f0-9b13-0a7574d92def

✨  Total time: 309.66s
```

```bash
export API_URL="https://4xnhiok2nh.execute-api.eu-west-1.amazonaws.com/v1/"
export API_KEY ="<api key you get from below>"
curl -X POST $API_URL/u \
     -H "Content-Type: application/json" \
     -d '{"url":"https://docs.powertools.aws.dev/lambda/python/latest/", "ttl": 300}'

{"message":"Hello, Mario"}
```


```bash
export API_URL=""

```