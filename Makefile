redis:
	docker run --name redis7 -d -p "6379:6379" redis:7.2

k8s:
	kubectl apply -f "manifests"

alive:
	curl 'http://localhost:3000/'

req1:
	curl -X POST -H "Content-Type: application/json" -d '{"key": "foo", "value": "bar"}' 'http://localhost:3000/'

req2:
	curl -X POST -H "Content-Type: application/json" -d '{"key": "foo", "value": "bar"}' 'http://localhost:8080/redis'
