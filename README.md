
Nodejure
========
Nodejure (previously, Shelloid) is an open source IoT-ready real-time big data web application platform built using Node.js and Clojure that contains integrated stream query capability. Of course, Nodejure has a ton of features (see below) that are useful even if you're not looking to add real-time big data or IoT capabilities to your application at the moment - using Nodejure will enable you to easily add these capabilities to your applications at a later point.

NOTE: This document is work in process and will be updated in the coming weeks.

Stream processing
=============

Nodejure allows developers to add stream processing logic to the server side. 

The core of stream processing is handed over the Clojure/JVM code, which is more computationally efficient.

Node.js Clojure integration
=====================

Nodejure attempts to bring out the best of two cool modern programming platforms: Node.js and Clojure. Node.js is great for web and real-time. Clojure is great for concurrent computations. So, why not let the Node.js handle the web requests and real-time messaging and use Clojure when there is a heavy computation at hand? Nodejure does just that.

Nodejure is essentially a Node.js web application server with integrated Clojure-based compute service which runs as a separate process. Nodejure takes care of all the integration details. While the Clojure compute service is executing a heavy computation, Node.js event loop is freed up to process other requests.

The following code snippet illustrates how the integration works. In the code, we define a compute service named add in Clojure. From Node.js this service is invoked by calling sh.ccs.add function (sh stands for Nodejure, ccs for Clojure compute service). This results in parameters being passed to the CCS process and the Clojure add service function being executed. The result of the Clojure function is passed back to Node.js and the callback is invoked with err message if any and the result value. After passing off the computation to the Clojure, Node.js event loop is freed up to execute other requests.

Node.js:
```javascript
	sh.ccs.add(100, 200, function(err, r){
	console.log("Result: " + r);
	});
```

Clojure
```clojure
	(service add [a b]
		(+ a b)
	)
```

Clojure compute service (CCS) requires [Leiningen](http://leiningen.org) to be installed somewhere in the system path.

Please Note: We've been busy working on the new stream query feature. We will start working on the documentation shortly. Please bear with us for some more time!

Quick sample (Updated!)
============

We have developed a quick sample to give you a basic understanding of Nodejure. The demo app uses New York's real time traffic feed to display a page showing the list of real-time "fast streets" (just our terminology) in New York, i.e., streets whose current traffic speed is above the average. The demo also implements "trending streets" stream (i.e., streets with speed differential greater than the mean speed differential) showcasing the let clause and diff. 

The sample source is available at: https://github.com/Nodejure/nyc-traffic.

Either do git clone or download the project zip file from github. For downloading zip, go the the project URL given above and in the right-hand margin (you may have to scroll down a bit) click on the "Download Zip" button.

Take a look at the project documentation (readme) at: https://github.com/Nodejure/nyc-traffic on instructions to run the sample.

Configurable transport
=====================

The transport between node.js and clojure and how clojure compute processes are created will be configurable. The default transport is a websocket between node.js and clojure. This is suitable for development and perhaps for simpler applications (so that no additional services need to be installed and configured). Other transports like reliable queues can be configured in production. Also it would be possible to run the clojure process(es) in another machine or a cluster of machines - again the programmer interface will remain same. 

Open, extensible architecture
===============================

Nodejure has an open, extensible architecture. While open sourcing is great for the users, Nodejure goes beyond merely being open source. Nodejure has a open architecture created from ground up, allowing you to easily write extensions that can modify the behaviour of the engine to suit your needs. Many of Nodejure's  built-in features are themselves built as extensions, leading to a relatively small and robust core.

Our vision is to simplify the development of secure and robust web applications and services, improving programmer productivity and enabling quick time-to-market. Nodejure takes care of the infrastructure logic and lets you focus on your business logic, leading to quick time to market for your business-critical applications. Nodejure is open sourced under LGPL license, allowing you to run your commercial closed source applications on the top of it.

Getting started
=================

Install: npm install -g nodejure 

Installation requires super user/admin privilege. Use "sudo" in Linux/unix and "Run as administrator" in Windows.

Initialize an app: Nodejure test-app init

To run: nodejure test-app


Key features (at the moment):

* Use of annotations instead of writing code for many useful functions.

* Configurable automatic restarting of the server in case of changes to the application code or unrecoverable errors.

* Built in authentication (via passport.js) - requires only a single authentication function to be written. 

* Currently supports local authentication as well as Google, Facebook, Twitter authentications out of the box.

* Custom authentication, e.g, for API implementations that is attached to routes via annotations.

* Built-in login session management.

* Built-in role-based access control with roles attached to controllers via annotations.

* Supports specification-based verification of API requests/responses. Simple API specification which is automatically checked against requests for enhanced security, robustness. The application code will be cleaner owing to lesser checks required.

* Built in cluster support by setting a single configuration flag. Builtin logging with cluster support.

* Simplified DB API with built-in connection pooling and close to synchronous-style programming.

* Support for declarative SQL query specifications as part of annotations. 

* Built in proper error and exception handling that takes care of sending error responses and freeing DB connections.

* Built in simple and versatile sequencing API that avoids callback hell and results in readily understandable code.

* Built-in simulator for controlled functional testing of application/controller logic (work in progress - please see sim/main.js in the Nodejure-sample-app). Will support control of the flow of time as well as specification and verification of temporal properties.

* Simple config specification for allowing cross-origin requests (implementation complying with CORS standard).

* Auto detection of the current node of execution based on specified node names to IP/hostname mapping - useful for distributed and cloud deployments.

* Support for easily configurable application UI themes.

* UI themes can be associated with domains, i.e., depending on the domain by which the site is accessed a separate set of files/views can be served. Note that, at the moment, controllers are shared across domains. This results in a limited support for virtual hosting.

* Easy websocket support that integrates with the normal HTTP route processing. A websocket route can be defined simply by annotating the controller with @websocket.

Currently the software is in alpha stage with featured being added on a daily (even hourly) basis. First full featured beta release is expected to happen in another week or so. After that we will be putting up more documentation.

The prelaunch web app (including its admin console) for the cloud log management platform for Nodejure (http://Nodejure.com) is built using Nodejure.

This app is released in open source so that it can serve as a real-life (used by our live prelaunch site) but simple enough example. 

Installation:
=============

npm install -g Nodejure


Please visit http://nodejure.org for more information and to register to Nodejure mailing list (low traffic).


