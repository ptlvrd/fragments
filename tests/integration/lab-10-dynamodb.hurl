# Lab 10 DynamoDB Integration Test

# POST a new JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

{ "service": "DynamoDB" }

HTTP/1.1 201

[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[A-Za-z0-9_-]+$"

# GET the fragment info for the first fragment
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# POST a second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1

`DynamoDB is great.`

HTTP/1.1 201

[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[A-Za-z0-9_-]+$"

# GET the fragment info for the second fragment
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 18

# GET all fragments (IDs only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# DELETE the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"

# Try to GET the deleted fragment (should return 404)
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# GET all fragments again (first should be gone)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"