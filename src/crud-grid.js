angular.module('angular.crud.grid')

.directive('crudGrid', function ($log, $http, $injector, $timeout) {
    return {
        restrict: 'A',
        replace: false,
        scope: {
            readOnly: '=',
            notificationService: '=',
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
            scope.searchFilter = {};

            scope.gridOptions = scope.$eval(attrs.gridOptions);
            for(var i=0; i < scope.gridOptions.columnDefs.length; i++) {
                var col = scope.gridOptions.columnDefs[i];
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
            scope.searchFilter = scope.gridOptions.searchFilter;
            scope.searchFilterUrl = scope.gridOptions.searchFilterUrl;

            //pagination.maxSize = 10; //number of visible page buttons
            scope.pagination = {itemsPerPage : scope.gridOptions.itemsPerPage};

            var getSortParams = function() {
                var result = [];
                for(var i=0; i < scope.orderBy.length; i++) {
                    result.push(scope.orderBy[i].field  + ',' + scope.orderBy[i].sort);
                }
                $log.debug('## getSortParams: ', result);
                return result;
            };

            scope.searchRequired = function() {
                $log.debug('searchRequired: ', scope.gridOptions.columnDefs);
                for(var i=0; i < scope.gridOptions.columnDefs.length; i++) {
                    col = scope.gridOptions.columnDefs[i];
                    //$log.debug('searchRequired col= ', col);
                    if (col.searchable) {
                        return true;
                    }
                }
                return false;
            }();

            scope.$watch('pagination.currentPage', function(oldValue, newValue){
                $log.debug(">> pagination.currentPage: ", oldValue, ' -> ', newValue); //trigger to get new data here
                //if (oldValue !== newValue) {
                    scope.getData(function () {
                        scope.loading = false;
                    });
                //}
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
                var useSearch = false;
                var queryParams = {page: scope.pagination.currentPage-1, size: scope.pagination.itemsPerPage}; //Spring Data pagination starts at 0 index
                for (var col in scope.searchFilter) {
                    if (scope.searchFilter.hasOwnProperty(col)) {
                        if (scope.searchFilter[col].trim().length > 0) {
                            queryParams[col] = scope.searchFilter[col].trim();
                            useSearch = true;
                        }
                    }
                }
                var searchPostfix = '';
                if (useSearch) {
                    if (!scope.searchFilterUrl) {
                        throw new Error("searchFilterUrl config not found");
                    } else {
                        searchPostfix = '/search' + scope.searchFilterUrl; //if search URL provided in config
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
                        $http({ method: 'POST', url: scope.gridOptions.baseUrl + '/' + scope.gridOptions.resourceName, data: scope.object})
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
                })
            };

            scope.deleteObject = function (object) {
                var modal = $injector.get('$modal');
                if (modal) {
                    var modalInstance = modal.open({
                        templateUrl: 'delete-confirm.tpl.html',
                        controller: function($scope, $modalInstance) {
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
                        var cleanEditObj = cleanObject(editObj);
                        //$http.put(editObj._links.self.href, cleanEditObj)
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
                                //scope.animateObject = editObj;
                                //object.$animated = 'animated flash';
                            })
                            .error(function(data, status) {
                                scope.animateObject = undefined;
                                scope.notificationService.notify('UPDATE', status, data);
                            });
                    }
                });
            };

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


                /*var updated = false;
                for(var i=0; i < scope.orderBy.length; i++) {
                    $log.debug('###### i=' + i, scope.orderBy[i], ' ## VS ## ', scope.viewOrderBy, ' Equals ? ', (scope.orderBy[i].field === scope.viewOrderBy.field));
                    if (scope.orderBy[i].field === scope.viewOrderBy.field) {
                        $log.debug('REPLACE: ', scope.orderBy[i], ' WITH: ', scope.viewOrderBy);
                        scope.orderBy[i] = scope.viewOrderBy;
                        updated = true;
                        break;
                    } else if (scope.orderBy[i].viewOrdering) {
                        scope.orderBy.splice(i, 1);//remove existing field from criteria
                        i--;
                    }
                }
                if (!updated) {
                    $log.debug('PUSH: ',  scope.viewOrderBy);
                    scope.orderBy.push(scope.viewOrderBy);
                }
*/
                $log.debug('>> setViewOrderBy - scope.viewOrderBy: ', scope.viewOrderBy);
                $log.debug('>> setViewOrderBy - scope.orderBy: ', scope.orderBy);
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