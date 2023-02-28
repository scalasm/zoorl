<p align="center">
  <img width="460" height="100" src="docs/images/logo.svg">
</p>

**Zoorl** is a **serverless URL shortener service** based on **AWS serverless stack**:
* AWS Lambda for scaling (the backing REST API is written in Python)
* DynamoDB as backing store
* CDK for infrastructure as code

I created this project as **a case study for learning about different AWS technologies and Python**: something simple, yet challenging for me :)

# Additional documentation
- [infrastructure](infrastructure/README.md) - this is the CDK App containaing multiple stacks for deploying the Zoor application resources:
  - `personal application stack` (this is a developer-specific stack useful for "local" testing)
  - `CI/CD pipeline stack` (the pipeline that will deploy the application stack in stages)
- [src/zoorl](src/zoorl/README.md) - is the implementation of the lambda functions in Python 3.9
  - The `codebase` hosts the different lambda functions in one single place (even if they are then deployed
  as different AWS resources)

# About the project 
The project backlog is available [here](https://github.com/users/scalasm/projects/4).

The code is released under MIT license: you can do whatever you want with it but there are no warranties in any case (e.g., expenses in your AWS account).

If you use it, please *drop me a line about your use case*!

Do you have another wonderful idea or spot a subtle bug? Feel free to *submit a pull request* or *create an issue* as reminder!

# Additional documentation
- [How to deploy](./docs/deployment.md) - you find instructions for deployment here
- [AWS Activate Workshop](https://activate.workshop.aws/) - this guides you to setup your AWS accounts correctly. Zoorl deployment strategu is based on this configuration, so you will need to adapt it to your 
organization, if different.

# Frequently Asked Questions

## What 'zoorl' stands for ?

It is a contraction of "Zipped URL", with "u" replaced by "oo" to be "cooler" :P

## Why another URL shortener project?

Just for learning, not need to compete with more famed solutions like [bit.ly](https://bitly.com/) and others. And maybe other people may find it useful too, you never know :)
