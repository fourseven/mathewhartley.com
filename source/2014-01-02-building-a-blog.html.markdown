---
title: Building a Blog
date: 2014-01-02
tags: HTML
---
After reading a [great article](http://blog.tedgonder.com/a-few-more-things-i-learned-in-college) online, I realised starting a blog would be a good idea. I've been though this before, but with very little success.

This time around, I decided to use [Middleman](http://middlemanapp.com) as I'd had good reviews.

The current state of this blog is from two tutorials, firstly Thoughtbot have an [intro to Middleman](http://robots.thoughtbot.com/middleman-bourbon-walkthrough) with their Compass frameworks for styling, which is where this blog currently stands.

I needed to correct a few things:

1. All middleman plugins (like livereload) need to be at the base of the Gemfile, and not within a group
2. The [nav/footer] partials have incorrect filenames in their headers (add partial/ to it).
3. Don't delete an S3 bucket and expect to remake it with the same name immediately in a different region. This process is slow, I couldn't remake the bucket for almost an hour as it was throwing an error (`A conflicting conditional operation is currently in progress against this resource. Please try again`).

To get it to the internet this site is hosted via S3 and uploaded with the AWS tools through instructions found [here](http://luk3thomas.com/aws-cli-middleman-s3-sync-20131202.html).
