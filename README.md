angular-crud-rest
=================

Angular grid for Spring Data REST backend

## Installation

```
install node
npm install -g grunt-cli
npm install
npm install -g bower
grunt
```

## Init submodule & track master branch:
```
git submodule update --init
cd dist
git checkout master
```

## Build, release & commit the main repo:
```
cd ..
grunt build
grunt release-patch
git add .
git commit -m "new release"
git push origin master
```

## Commit submodule (Bower repo):

Make the necessary changes to your package artifact(s) (bug fixes, new features, etc, etc...whatever it might be).
Update your bower.json file with the new version for the package.
Commit your changes, tag the repository and push your changes to git (don't forget to include the --tags switch with your push command to your remote!)
Bower relies solely on git tags for package version information.

NOTE: 'grunt release-patch' is doing most of the work in regars to Bower repo

```
cd dist
# see changes
git status

# add & commit changes: 			git commit -am "new bower release" 			(already done by:  'grunt release-patch' )
# tag the commit: 					git tag -a 1.0.1 -m "Release version 1.0.1" (already done by: 'grunt release-patch')
# push to GitHub (including tags): 	git push origin master --tags 				(already done by: 'grunt release-patch')
```

## Register with Bower (does not work under firewal)

```
bower register angular-crud-rest git://github.com/flado/angular-crud-rest-bower.git
```

## Bower install

Clean cache first and install last version:

```
bower cache list
bower cache clean
bower install
```

## Test angular-crud-rest directive

A Spring Data REST sample application is provided in /java-server folder to test this directive.
You must have JRE & Maven 3 installed to run this server.

```
cd java-server
mvn tomcat7:run
```
Go to http://localhost:9444/crud-grid-rest/