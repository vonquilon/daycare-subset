'use strict';
var listingController = angular.module('listingController', ['nvd3']);

listingController.controller('listingCtrl', ['$scope', '$cookies', '$timeout', 'listingService', 'reviewService', '$state', '$stateParams', 'AuthService', 'ownershipService', 'API_ENDPOINT',
    function ($scope, $cookies, $timeout, listingService, reviewService, $state, $stateParams, AuthService, ownershipService, API_ENDPOINT) {
        var self = this;
        var state = $state.current.name;

        var ownerBtn = $('#ownership-btn'),
            ownerBtnIcon = ownerBtn.find('i');

        self.user = angular.copy(AuthService.getUser());
        self.downloadPdf = downloadPdf;
        self.requestOwnership = requestOwnership;
        self.ownerBtnDisplay = 'Loading';
        self.isProvider = false;
        self.isAdmin = false;
        self.isParent = false;
        self.disableOwnerBtn = true;
        self.ratings = [];
        self.isReviewsLoaded = false;
        self.getReviewsByUser = getReviewsByUser;
        self.userHasReview = userHasReview;
        self.reviews = {};

        onLoad();

        function onLoad() {
            if (state == 'listingDetail') {
                setTimeout(function () {
                    $('#aboutTabLink').focus();
                }, 5);
            }
        }

        function getOwnershipStatus(listingId, userId) {
            //console.log(listingId);
            ownershipService.getRequest({userId: userId, listingId: listingId}, function (ownerRequest) {
                console.log(ownerRequest);

                ownerBtnIcon.removeClass('fa-spinner fa-spin');

                switch (ownerRequest.status) {
                    case 'pending':
                        self.ownerBtnDisplay = 'Ownership Request Pending';
                        ownerBtnIcon.addClass('fa-question');
                        break;
                    case 'approved':
                        self.ownerBtnDisplay = 'You Own This Daycare';
                        ownerBtn.addClass('green-bg full-opacity');
                        ownerBtnIcon.addClass('fa-check');
                        break;
                    case 'rejected':
                        self.ownerBtnDisplay = 'Ownership Request Rejected';
                        ownerBtn.addClass('red-bg full-opacity');
                        ownerBtnIcon.addClass('fa-close');
                        break;
                    default:
                        // no ownership request found
                        self.ownerBtnDisplay = 'I\'m the Owner';
                        self.disableOwnerBtn = false;
                        ownerBtnIcon.addClass('hide');
                        break;
                }
            });
        }

        function requestOwnership() {
            ownerBtnIcon.removeClass('hide');

            ownershipService.save({owner: self.user.id, listing: $stateParams.listingId}, function (response) {
                console.log(response);

                if (response.owner_requested) {
                    self.ownerBtnDisplay = 'Ownership Request Pending';
                    self.disableOwnerBtn = true;
                    ownerBtnIcon.removeClass('fa-spinner fa-spin').addClass('fa-question');
                } else {
                    ownerBtnIcon.addClass('hide');
                }
            });
        }
    }]);
