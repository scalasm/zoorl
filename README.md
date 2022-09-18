<p align="center">
  <img width="460" height="100" src="docs/images/logo.svg">
</p>

**Zoorl** is a **serverless URL shortener service** based on **AWS serverless stack**:
* AWS Lambda for scaling (the backing REST API is written in Python)
* DynamoDB as backing store
* CDK for infrastructure as code

I created this project as **a case study for learning about different AWS technologies and Python**: something simple, yet challenging for me :)

# Additional documentation
- [infrastructure](infrastructure/README.md) - this is the CDK App
- [src/zoorl](src/zoorl/README.md) - is the implementation of the lambda functions in Python 3.9
  - The codebase is the same for multiple functions - this may change in the future

# About the project 
The project backlog is available [here](https://github.com/users/scalasm/projects/4).

The code is released under MIT license: you can do whatever you want with it but there are no warranties in any case (e.g., expenses in your AWS account).

If you use it, please *drop me a line about your use case*!

Do you have another wonderful idea or spot a subtle bug? Feel free to *submit a pull request* or *create an issue* as reminder!

# Frequently Asked Questions

## What 'zoorl' stands for ?

It is a contraction of "Zipped URL", with "u" replaced by "oo" to be "cooler" :P

## Why another URL shortener project?

Just for learning, not need to compete with more famed solutions like [bit.ly](https://bitly.com/) and others. And maybe other people may find it useful too, you never know :)
