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

## Commit submodule:

```
cd dist
git status
git add .
git commit -m "new bower release"
git push origin master
```

