.PHONY: build deploy dev

dev:
	npx astro dev

build:
	npx astro build

deploy: build
	aws --profile=personal s3 sync dist/ s3://www.mathewhartley.com/ --delete --cache-control="max-age=1576800000" --exclude "*.html"
	aws --profile=personal s3 sync dist/ s3://www.mathewhartley.com/ --delete --cache-control="max-age=0, no-cache" --exclude "*" --include "*.html"
