deploy:
	@bundle exec middleman build
	@aws --profile=personal s3 sync build/ s3://mathewhartley.com/ --acl=public-read --delete --cache-control="max-age=1576800000" --exclude "*.html"
	@aws --profile=personal s3 sync build/ s3://mathewhartley.com/ --acl=public-read --delete --cache-control="max-age=0, no-cache" --exclude "*" --include "*.html"
