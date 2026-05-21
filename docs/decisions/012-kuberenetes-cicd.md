# Kubernetes Deployment Pipeline

## Status

Accepted

## Context and Problem Statement

The website needs to be deployed in some manner and setting it up to be deployed via docker image would allow the deployment to be very portable, while also providing consistency in being able to recreate nearly the exact same runtime conditions (which can help with debugging and stability). Building images can take a while so it would likely be worth it to also take steps to do so automatically to not waste our team's time.

In addition to this, it is also a requirement that we actually host the product we are working on to present it to our stakeholders. It is also important the method by which we host it also supports deploying a development build, as this would allow for testing in a staging environment that mimics the production environment as much as possible.

## Decision Drivers

* The app should be highly portable
* The app should be easy for deployment by others (like our TA)
* The method of deployment needs to require very minimal human involvement to support frequent builds.

## Considered Options

* Using SSH, git, and `node .` to copy and start process (could be augmented with something like pm2.
* Deployment of containerized process using Docker Compose.
* Deployment of containerized process using Kubernetes.
* Deployment using third party service (like Vercel).

## Decision Outcome

Chosen option: "Deploying via Kubernetes", because I (Timothy) have already spent a lot of time prior to this class designing a Kubernetes cluster specifically for deploying projects like this. This also requires we build a custom docker image, and the system is designed in such a way that someone else wanting to host the service could do so by deploying my Kubernetes environment OR just running the built image directly. The image will be built automatically on push to deployed branches in order to entirely eliminate manual effort required to deploy updates.

### Consequences

* Good: It is very stable and attaches automatically to logging and metrics tools. The production and staging environments can be recreated reliably allowing for identified bugs to be traced to source and recreated off-production.
* Bad: The deployment is dependent on a complex Kubernetes stack likely in danger of making our bus factor 1. This was mitigated through pair programming (the deployment was done by 2 people not 1), and also by the portability of the docker container (if in the future no one on the team could run the project on the Kubernetes stack it would be fairly trivial to switch to a less complicated stack using the same Docker image already being built automatically).

## Pros and Cons of the Options

### SSH, git, `node .`

* Good, because it's very simple and quick to get set up.
* Bad, because it has no crash handling and is prone to many things in the deployment pipeline failing in a difficult to account for way.

### Docker Compose

* Good, because it allows for a containerized deployment with a simple yet powerful declarative manifest.
* Bad, because Docker Compose is specifically not meant for production environments; while it might work in this class it is using the tool for something it was inherently not meant for.

### Kubernetes

* Good, explained above.
* Bad, explained above.

### Managed SaaS (ex: Vercel)

* Good, because these tools have spent a lot of time trying to make deploying as easy as possible to get started.
* Bad, because of incredibly limiting free tiers and being entirely unflexible with some specific constraints (not to name any specifically--it is just likely we would run into one later after making this marrying decision and have a hard time addressing it when it comes up).
