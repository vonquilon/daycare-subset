var dashboardModule = angular.module('dashboardController', ['ngAnimate','ngSanitize']);

dashboardModule.controller('dashboardCtrl', ['$scope','$q','$cookies','AuthService', '$http', '$state', 'userService',
    'securityQuestionsService', 'allUserService', 'localStorageService', 'reviewService', 'listingService',
    'ownershipService', 'stateService', 'messageService', '$location', '$stateParams', '$rootScope','articleService','hackService','orderByFilter', 'AutoLogoutService',
    function ($scope,$q, $cookies, AuthService, $http, $state, userService, securityQuestionsService, allUserService,
              localStorageService, reviewService, listingService, ownershipService, stateService, messageService, $location, $stateParams, $rootScope, articleService,
              hackService, orderBy, AutoLogoutService) {

        var self = this;

        $scope.user = angular.copy(AuthService.getUser());

        // adjust image sources for avatar in edit profile state
        if ($state.current.name == 'dashboard_edit_profile') {

            if (!$scope.editUser.photo) {
                if ($scope.editUser.sex == 'Female') {
                    $scope.editUser.photo = 'assets/theme/images/people/avatar_blank_female.jpg';
                } else {
                    $scope.editUser.photo = 'assets/theme/images/people/avatar_blank_male.jpg';
                }
            }

            $http.get($scope.editUser.photo,{responseType:'arraybuffer'}).then(function(response) {
                var imgFile = b64ToFile(new Uint8Array(response.data), 'image/png', '.png', true);
                $scope.imgSelected(imgFile);
            });
        }
        else if ($state.current.name == 'dashboard_all_owner_requests') {
            ownershipService.get({}, function (response) {
                $scope.all_owner_requests = response.searchResult;
                $scope.range();
            });
        }

        function b64ToFile(b64, mimeType, extName, skipDecode) {
            var binaryImg,
                ua;
            if (!skipDecode) {
                binaryImg = window.atob(b64.split(',')[1]);
                ua = new Uint8Array(new ArrayBuffer(binaryImg.length));
                for (var i = 0; i < ua.length; i++) {
                    ua[i] = binaryImg.charCodeAt(i);
                }
            } else {
                ua = b64;
            }
            return new Blob([ua], {type: mimeType, encoding: 'utf-8'});
        }

        $scope.onLoad = function () {
            if ($rootScope.email_changed) {
                $rootScope.email_changed = false;
                swal({
                    title: "Email Verification Required",
                    html: true,
                    text: "In order to activate your account, you need to verify your email by clicking the email "+
                    "verification link in the Welcome email from Ratingsville.com. Please click OK below and verify your email so " +
                    "you can log in and enjoy the benefits of Ratingsville.com. You will also be automatically logged out.",
                    type: "warning"
                }, function () {
                    logout();
                });
            } else if ($rootScope.show_sms_modal) {
                $rootScope.show_sms_modal = false;
                setTimeout(function () {
                    var events;
                    $('#need-sms-verify').off('shown.bs.modal').on('shown.bs.modal', function () {
                        events = hackService.bindEscapeModalSeq(this);
                        hackService.allowSecondModalFocus();
                        $('#verifySMSInput').focus();
                    })
                    .off('hide.bs.modal').on('hide.bs.modal', function(e) {
                        hackService.unbindCustomEvents(events);
                    });
                    $('#sms-verify-btn').click();
                }, 1);
            }
        }

        $scope.imgSelected = function (img) {
            console.log(img);
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function ($scope) {
                    $scope.imgToCrop = evt.target.result;
                });
            };
            reader.readAsDataURL(img);
        }

        $scope.deleteOwnerRequest = function (ownerRequest) {
            console.log(ownerRequest._id);

            swal({
                title: "Confirmation",
                text: "Are you sure you want to delete this ownership request?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }, function () {
                ownershipService.delete({ownerRequestId: ownerRequest._id}, function (response) {

                    var ownerRequests = $scope.all_owner_requests;
                    $.each(ownerRequests, function (i, obj) {
                        if (obj._id === ownerRequest._id) {
                            $scope.all_owner_requests.splice(i, 1);
                        }
                    });

                    console.log(response);
                    swal("Deleted!", "Ownership request has been deleted.", "success");
                });

            });
        }

        $scope.activateOwnerRequest = function (data, option) {
            data.status = option;
            if (option == 'approved') {
                data.listing.owner_id = data.owner;
            } else {
                data.listing.owner_id = null;
            }

            var response = ownershipService.update({
                ownerRequestId: data._id
            }, {
                status: option,
                owner: {
                    _id: data.owner._id
                },
                listing: {
                    _id: data.listing._id
                }
            }, function () {
                console.log(response);
            });
        }

        $scope.onLoad();

    }]);
