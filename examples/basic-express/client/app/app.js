/* global angular, window */

angular.module('sampleKoastClientApp', ['koast'])

.controller('myCtrl', ['$scope', 'koast', '$timeout', '$q', '$log',
  function ($scope, koast, $timeout, $q, $log) {
    'use strict';

    var maxNumber = 0;

    // Initiates login.
    $scope.login = function(provider) {
      koast.user.initiateOauthAuthentication(provider);
    };

    // Logs out the user.
    $scope.logout = function(provider) {
      koast.user.logout(provider);
    };

    // Registeres the user if the provided username is available.
    $scope.register = function() {
      var username = $scope.selectedUsername;
      $log.debug(username);
      koast.user.checkUsernameAvailability(username)
        .then(function(isAvailable) {
          if (isAvailable) {
            return koast.user.registerSocial({username: username});
          } else {
            window.alert('Username taken!');
          }
        })
        .then(null, $log.error);
    };

    // Attach the user service to the scope.
    $scope.user = koast.user;

    // Now onto robots, which is our data.
    function reload() {
      // Request all robots from the server.
      koast.queryForResources('robots')
        .then(function (robots) {
          $scope.robots = robots;
          robots.forEach(function(robot) {
            if (robot.robotNumber > maxNumber) {
              maxNumber = robot.robotNumber;
            }
          });
        }, $log.error);
      $scope.robotStatus = {};
    }

    // A factory for functions for updating robots' statuses.
    function makeRobotStatusUpdater(status, robotNumber) {
      if (status==='success') {
        return function() {
          $scope.robotStatus[robotNumber] = 'Success!';
        };
      } else {
        return function(error) {
          $scope.robotStatus[robotNumber] = 'Oops: ' + error.toString();
        };
      }
    }

    // Saves a robot upon button click.
    $scope.saveRobot = function (robot) {
      robot.save()
        .then(makeRobotStatusUpdater('success', robot.robotNumber))
        .then(null, makeRobotStatusUpdater('error', robot.robotNumber));
    };

    // Deletes a robot.
    $scope.deleteRobot = function (robot) {
      robot.delete()
        .then(makeRobotStatusUpdater('success', robot.robotNumber))
        .then(null, makeRobotStatusUpdater('error', robot.robotNumber));
    };

    // Creates a new robot and saves it.
    $scope.createRobot = function() {
      maxNumber += 1;
      var newRobotData = {
        robotNumber: maxNumber,
        robotName: 'Marvin90',
        owner: 'yuri'
      };
      koast.createResource('robots', newRobotData)
        .then(function() {
          return koast.getResource('robots', {robotNumber: maxNumber});
        })
        .then(function(newRobot) {
          $scope.robots.push(newRobot);
        }, $log.error);
    };

    // Now onto things that execute when the controller is loaded.
    // First we wait until user's login status is known.
    koast.user.getStatusPromise()
      .then(function(status) {
        var query = {
          robotNumber: 1
        };

        $log.debug('Looking good');

        // Then we request one robot from the server.
        koast.getResource('robots', query)
          .then(function (robot) {
            $scope.myRobot = robot;
          }, $log.error);

        // And reload the robot list.
        reload();

      })
      .then(null, $log.error);
  }
])

.run(['koast', '$log',
  function (koast, $log) {
    'use strict';
    koast.init({
      baseUrl: 'http://localhost:3000',
      siteTitle: 'App Awesome'
    });
    koast.setApiUriPrefix('/api/');
    koast.addEndpoint('robots', ':robotNumber', {
      useEnvelope: true
    });
  }
]);
