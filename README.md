# Analytics Engine API

This projects aimed the creating of a system that allows the publish of applications that are shared in a online maner via an API.
The main goal was of this project was to process and analylise data comming from IoT devices or Big Data storage servers, that can then be forther processed by a set of applications dinamicly installed on a server.

The applications can be range from any executable file to a pre-installed application like python, node, etc.. They are executed in a command line manner according to their configured parameters when installing the app on the API server.

## Instalation

### Prerequisite:

* Install docker - https://docs.docker.com/install/
* Install docker compose - https://docs.docker.com/compose/install/

### Booting the engine:

1. Navigate to [scripts](https://github.com/Carlosamouco/AnalyticsEngine/tree/master/scripts) folder and run:
  1. **./start** or **./start-prod** (if in linux)
  1. Wait for the installation to finish and navigate to http://localhost
    
## Suported Applications:

Any command line compatible application can be installed. Files created by the application during their execution whose data we want to return by the engine must be created in a special folder that is mannaged by the analytics engine. This can be managed via the installation interface on the Engine.
  
## Applications Execution Options:

* Applications can be run in a isolated and non-isolated manner via a sadbox based on docker containers.
* Applications output can be converted to JSON format or returned as Raw string. Default parsers are *csv*, *xml* and *json*.
* Applications input data can be sent in a JSON format and then be converted to the file format exepected by the application. Default parsers are *csv*, *xml* and *json*.
* Applications must have a timeout value causing force termination if they exceed their execution time.
