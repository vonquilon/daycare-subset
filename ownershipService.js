(function() {
  'use strict';

  angular.module('routerApp')
    .factory('ownershipService', ownershipService);
  
  ownershipService.$inject = ['$resource'];

  function ownershipService($resource) {
    return $resource('/api/owner-request/:ownerRequestId', {}, {
      getRequest: {
        method: 'GET',
        url: '/api/owner-request/user/:userId/listing/:listingId'
      },
      update: {
        method: 'PUT'
      }
    });
  }
})();