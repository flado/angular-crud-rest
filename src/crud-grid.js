angular.module('angular.crud.grid')

.filter('isEmpty', function () {
    var bar;
    return function (obj) {
        for (bar in obj) {
            if (obj.hasOwnProperty(bar)) {
                return false;
            }
        }
        return true;
    };
})

.filter('allPropertiesEmpty', function () {
    var bar;
    return function (obj) {
        for (bar in obj) {
            if (obj.hasOwnProperty(bar)) {
                if (obj[bar] && obj[bar].trim().length > 0) {
                    return false;
                }
            }
        }
        return true;
    };
})

.directive('crudGrid', function ($log, $http, $injector, $timeout, $filter) {
    return {
        restrict: 'A',
        replace: false,
        scope: {
            readOnly: '=',
            notificationService: '=',
            serverValidationService: '=',
            baseUrl: '='
        },


        require: '^form',

        link: function(scope, elem, attrs, formCtrl) {
            $log.debug('>>>>> link <<<<<<<<<<', formCtrl);

            if (toastr) {
                toastr.options.closeButton = true;
            } else {
                $log.warn('toastr library is missing');
            }

            scope.objects = [];
            scope.addMode = false;
            scope.editMode = false;
            scope.previous = "<< Previous";
            scope.next = "Next >>";



            scope.colDefMap = {}; //key: field name

            scope.searchFilter = {};
            scope.gridOptions = scope.$eval(attrs.gridOptions);

            if (scope.readOnly) {
                scope.headerColSpan = scope.gridOptions.columnDefs.length;
            } else {
                scope.headerColSpan = scope.gridOptions.columnDefs.length + 1;
            }

            //TODO: validate gridOptions mandatory properties & log default values

            if (scope.gridOptions.searchConfig) {
                if (scope.gridOptions.searchConfig.hideSearchPanel) {
                    scope.hasSearchPanel = false;
                } else {
                    scope.hasSearchPanel = true;
                }
            }
            //validate searchConfig
            if (scope.hasSearchPanel) {
                var cfg = scope.gridOptions.searchConfig;
                if (cfg.fields.length == 0) {
                    throw new Error("searchConfig.fields is missing");
                }
                if (cfg.fields.length == 1) {
                    if (cfg.filters.length != 1) {
                        throw new Error("searchConfig.filters should define a single URL for field: " + cfg.fields[0]);
                    }
                }
                if (cfg.fields.length > 1) {
                    if (cfg.filters.length != 2) {
                        throw new Error("searchConfig.filters should specify both AND + OR filters");
                    }
                }
            }

            for(var i=0; i < scope.gridOptions.columnDefs.length; i++) {
                var col = scope.gridOptions.columnDefs[i];
                //derive if col is searchable
                if (scope.hasSearchPanel && scope.gridOptions.searchConfig.fields.indexOf(col.field) > -1) {
                    col.searchable = true;
                    scope.searchFilter[col.field] = '';//empty string
                }
                scope.colDefMap[col.field] = col;
                if (col.sortable === undefined) {
                    col.sortable = true; //by default every column is sortable
                } else {
                    $log.debug('# field: ', col.field, ' -> NOT SORTABLE');
                }
            }

            if (!scope.gridOptions.baseUrl) {
                scope.gridOptions.baseUrl = 'api';
            }

            scope.orderBy =  scope.gridOptions.orderBy ? scope.gridOptions.orderBy : [];
            scope.viewOrderBy =  [];
            var maxSizePagination = 10; //number of visible page buttons
            if (scope.gridOptions.maxSize) {
                maxSizePagination = scope.gridOptions.maxSize;
            }
            scope.pagination = {itemsPerPage : scope.gridOptions.itemsPerPage, maxSize: maxSizePagination};

            var getSortParams = function() {
                var result = [];
                for(var i=0; i < scope.orderBy.length; i++) {
                    result.push(scope.orderBy[i].field  + ',' + scope.orderBy[i].sort);
                }
                $log.debug('## getSortParams: ', result);
                return result;
            };

            scope.searchLogic = { and: false }; //default search logic is OR if none specified in config

            scope.$watch('pagination.currentPage', function(oldValue, newValue){
                $log.debug(">> pagination.currentPage: ", oldValue, ' -> ', newValue); //trigger to get new data here
                scope.getData(function () {
                    scope.loading = false;
                });
            });
            //set start page index
            scope.pagination.currentPage = 1;

            scope.search = function() {  //apply search filter to referesh data
                $log.debug('>> search() <<');
                if (scope.pagination.currentPage > 1) {
                    scope.pagination.currentPage = 1; //this will trigger a getData() call
                } else {
                    scope.getData(function () {
                        scope.loading = false;
                    });
                }
            };


            scope.getData = function (cb) {
                $log.debug('>> getData <<');
                scope.loading = true;
                var hasSearchFilter = false;
                var queryParams = {page: scope.pagination.currentPage-1, size: scope.pagination.itemsPerPage}; //Spring Data pagination starts at 0 index

                //check if serachFilter has all props empty
                hasSearchFilter = !$filter('allPropertiesEmpty')(scope.searchFilter);
                var searchPostfix = '';

                if (hasSearchFilter) {
                    for (var field in scope.searchFilter) {
                        if (scope.searchFilter.hasOwnProperty(field)) {
                            if (scope.searchFilter[field].trim().length > 0) {
                                queryParams[field] = scope.searchFilter[field].trim();
                            } else if (scope.colDefMap[field].type  == 'S'){ //default search value for Strings
                                queryParams[field] = '%';
                            }
                        }
                    }
                    var filters = scope.gridOptions.searchConfig.filters;
                    if (filters.length > 1) {
                        for(var i=0; i < filters.length; i++) {
                            if ((filters[i].logic == "AND" && scope.searchLogic.and) || (filters[i].logic == "OR" && !scope.searchLogic.and) ) {
                                scope.searchFilterUrl = filters[i].url;
                                break;
                            }
                        }
                    } else {
                        scope.searchFilterUrl = filters[0].url;
                    }
                    searchPostfix = '/search' + scope.searchFilterUrl;
                }
                //check fo default search filter (eg. discriminator column)
                if (scope.gridOptions.searchConfig) {
                    var defaultFilter = scope.gridOptions.searchConfig.defaultFilter;
                    if (defaultFilter) {
                        queryParams[defaultFilter.fieldName] = defaultFilter.fieldValue;
                        searchPostfix = '/search' + defaultFilter.url;
                    }
                }

                //set sort order using config
                var sort = getSortParams();
                if (sort.length > 0) {
                    queryParams.sort = sort;
                }

                $http({ method: 'GET', url: scope.gridOptions.baseUrl + '/' + scope.gridOptions.resourceName + searchPostfix, params: queryParams })
                    .success(function (data, status) {
                        $log.debug('successGetCallback:', data);
                        if (data._embedded) {
                            scope.objects = data._embedded[scope.gridOptions.resourceName]; //array of items
                        } else {
                            scope.objects = [];
                        }
                        if (data.page) {
                            scope.pagination.totalItems = data.page.totalElements;
                        } else {
                            scope.pagination.totalItems = scope.objects.length;
                        }
                        if (cb) cb();
                    })
                    .error(function(data, status) {
                        if (cb) cb();
                        scope.notificationService.notify('LIST', status, data);
                    });
            };

            scope.toggleAddMode = function () {
                scope.addMode = !scope.addMode;
                scope.object = {}; //add object in scope for data binding in template.html
            };

            scope.toggleEditMode = function (object) {
                scope.editMode = !object.$edit;
                object.$animated = '';
                if (scope.editMode) {
                    // object.$animated = '';
                    var copyObj ={};
                    angular.copy(object, copyObj);
                    object.$edit = copyObj
                } else {
                    if (object.$edit) {
                        delete object.$edit;
                        // object.$animated = 'animated flash';
                    }
                }
                $log.debug("@ toggleEditMode: ", object);
            };


            scope.addObject = function () {
                $log.debug('addObject: ', scope.object);
                scope.animateObject = undefined;
                $timeout(function() {
                    // TO make sure the validation cycle has completed before going to save
                    if (isFormValid()) { //only one addForm per page
                        //add default values (if any)
                        for(var i=0; i < scope.gridOptions.columnDefs.length; i++) {
                            var col = scope.gridOptions.columnDefs[i];
                            if (col.hide && col.defaultOnAdd) {
                                scope.object[col.field] = col.defaultOnAdd;
                            }
                        }

                        //check for validation service
                        if (scope.serverValidationService) {
                            //validateAction returns promise
                            scope.serverValidationService.validateAction('ADD', scope.object, scope.gridOptions.resourceName).then(
                                //promise ok
                                function(result){
                                    if (!result.valid) {
                                        scope.object.$serverValidationMessage = result.message;
                                        scope.notificationService.notify('ADD', 409, scope.object);
                                    } else {
                                        doInsert(scope.object, $http);
                                    }
                                },
                                //promise error
                                function(reason) {
                                    scope.notificationService.notify('ADD', 500, reason);
                                }
                            );
                        } else { //no server side validation required
                            doInsert(scope.object, $http);
                        }
                    }
                })
            };

            var doInsert = function(insertObj, $http) {
                $http({ method: 'POST', url: scope.gridOptions.baseUrl + '/' + scope.gridOptions.resourceName, data: insertObj})
                .success(function(data, status, headers, config) {
                    $log.debug('successPostCallback: ', data);
                    scope.notificationService.notify('ADD', status, data);
                    scope.getData(function () {
                        scope.loading = false;
                        scope.toggleAddMode();
                    });
                })
                .error(function(data, status) {
                    scope.notificationService.notify('ADD', status, data);
                });
            }

            scope.deleteObject = function (object) {
                var modal = $injector.get('$modal');
                if (modal) {
                    var modalInstance = modal.open({
                        templateUrl: 'delete-confirm.tpl.html',
                        controller: function($scope, $modalInstance) {
                            $scope.object = object;
                            $scope.gridOptions = scope.gridOptions;

                            $scope.cancel = function() {
                                $modalInstance.dismiss('cancel');
                            };
                            $scope.delete = function() {
                                //$http.delete(object._links.self.href).success( successCallback ).error( errorCallback ); //DOES NOT WORK IN IE
                                $http({method: 'DELETE', url: object._links.self.href })
                                    .success(function(data, status) {
                                        $modalInstance.close(data);
                                        scope.notificationService.notify('DELETE', status, data);
                                        scope.getData(function () {
                                            scope.loading = false;
                                        });
                                    }).error(function(data, status) {
                                        scope.notificationService.notify('DELETE', status, data);
                                    });
                            };
                        }
                    });
                } else { //no $modal found
                    var r = confirm('Are you sure you want to delete this record?');
                    if (r == true) {
                        $http({method: 'DELETE', url: object._links.self.href })
                                    .success(function(data, status) {
                                        $modalInstance.close(data);
                                        scope.notificationService.notify('DELETE', status, data);
                                        scope.getData(function () {
                                            scope.loading = false;
                                        });
                                    }).error(function(data, status) {
                                        scope.notificationService.notify('DELETE', status, data);
                                    });
                    }

                }
            };

            var cleanObject = function(obj) {
                var cleanObj = {};
                angular.copy(obj, cleanObj);
                delete cleanObj._links;
                return cleanObj;
            };

            scope.updateObject = function (object, elem) {
                var editObj = object.$edit;
                $log.debug('updateObject: ', editObj, elem);

                $timeout(function() {
                    // use $timeout tO make sure the validation cycle has completed before going to save
                    if (isFormValid()) {

                        if (scope.serverValidationService) {
                            //validateAction returns promise
                            scope.serverValidationService.validateAction('UPDATE', editObj, scope.gridOptions.resourceName).then(
                                //promise ok
                                function(result){
                                    if (!result.valid) {
                                        editObj.$serverValidationMessage = result.message;
                                        scope.notificationService.notify('UPDATE', 409, editObj);
                                    } else {
                                        doUpdate(editObj, $http);
                                    }
                                },
                                //promise error
                                function(reason) {
                                    scope.notificationService.notify('UPDATE', 500, reason);
                                }
                            );
                        } else { //no server side validation required
                            doUpdate(editObj, $http);
                        }
                    }
                });
            };

            var doUpdate = function(editObj, $http) {
                var cleanEditObj = cleanObject(editObj);
                $http({ method: 'PUT', url: editObj._links.self.href, data: cleanEditObj })
                .success( function(data, status) {
                    scope.notificationService.notify('UPDATE', status, data);
                    scope.getData(function () {
                        scope.loading = false;
                        for(var i=0; i < scope.objects.length; i++) {
                            if (scope.objects[i]._links.self.href == editObj._links.self.href) {
                                scope.objects[i].$animated = 'animated flash';
                            }
                        }
                    });
                })
                .error(function(data, status) {
                    scope.animateObject = undefined;
                    scope.notificationService.notify('UPDATE', status, data);
                });
            };

            scope.valueChanged = function(field, value) {
                $log.debug('## valueChanged: ', field, value);
            }

            scope.isInputForm = function(object, col) {
                return object.$edit && !col.readOnly;
            };

            //check if form is valid
            function isFormValid() {
                var valid = formCtrl.$valid;
                if (!valid) {
                    $log.debug('# Form -> invalid');
                    scope.notificationService.notify('FORM_INVALID');
                }
                return valid;
            };


            scope.setViewOrderBy = function (col) {
                var field = col.field;
                $log.debug('>> setViewOrderBy: ', field, ' >> scope.orderBy: ', scope.orderBy);
                for(var i=0; i < scope.objects.length; i++) {
                    scope.objects[i].$animated = '';
                }
                var asc = scope.viewOrderBy.field === field ? !(scope.viewOrderBy.sort == 'asc') : true;
                scope.viewOrderBy = { field: field, sort: asc ? 'asc' : 'desc' };
                //scope.viewOrderBy.viewOrdering = true;
                scope.orderBy.length = 0;
                scope.orderBy.push(scope.viewOrderBy);
                //get data sorted by new field
                scope.getData(function () {
                    scope.loading = false;
                });
            };

            scope.refresh = function() {
                scope.getData(function () {
                    scope.loading = false;
                });
            };

            scope.search = function() {
                $log.debug('## search: ', scope.searchFilter);
                scope.getData(function () {
                    scope.loading = false;
                });
            };

            scope.hasError = function(formField, validation) {
              $log.debug('> hasError -> formField: ', formField);
              var error = false;
              if (angular.isUndefined(formField)) {
                error = false;
              } else if (validation) {
                error = formField.$error[validation];
              } else {
                error = formField.$invalid;
              }
              //$log.debug('> hasError -> formField: ', formField, 'returns: ', error);
              return error;
            };

        },
        templateUrl: 'crud-grid.tpl.html'
    }
});