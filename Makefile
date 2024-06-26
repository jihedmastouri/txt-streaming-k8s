.PHONY: redis
redis:
	@docker start redis7 || docker run --name redis7 -d -p "6379:6379" redis:7.2

.PHONY: docker-1
docker-1:
	@docker build ./solution-1/client -t node-ms-sol1
	@docker build ./solution-1/server -t python-ms-sol1

.PHONY: docker-2
docker-2:
	@docker build ./solution-2/client -t node-ms-sol2
	@docker build ./solution-2/server -t python-ms-sol2

.PHONY: apply-1
apply-1:
	kubectl apply -f ./solution-1/k8s

.PHONY: apply-2
apply-2:
	kubectl apply -f ./solution-1/k8s

.PHONY: alive-1
alive-1:
	curl 'http://localhost:3000/'

.PHONY: alive-2
alive-2:
	curl 'http://localhost:3000/'

.PHONY: req-1
req-1:
	curl -N -X POST -H "Content-Type: application/json" -d '{"data": "Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis."}' 'http://localhost:3000/'

.PHONY: req-2
req-2:
	curl -N -X POST -H "Content-Type: application/json" -d '{"data": "Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis."}' 'http://localhost:3001/'
