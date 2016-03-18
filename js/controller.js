(function(angular) {
  'use strict';

  var io = require('socket.io-client')('http://127.0.0.1:9005');
  io.on('connected', function(data){
    console.log(data)
  });

  function MirrorCtrl(AnnyangService, GeolocationService, WeatherService, MapService, SubwayService, YoutubeService, HueService, $scope, $timeout, $sce) {
    var _this = this;
    var command = COMMANDS.ko;
    var DEFAULT_COMMAND_TEXT = command.default;
    $scope.listening = false;
    $scope.debug = false;
    $scope.complement = command.hi;
    $scope.focus = "default";
    $scope.user = {};
    $scope.interimResult = DEFAULT_COMMAND_TEXT;

    $scope.colors=["#6ed3cf", "#9068be", "#e1e8f0", "#e62739"];

    SC.initialize({
      client_id: SOUNDCLOUD_APT_KEY
    });

    $scope.musicplay = null;
    SC.stream('/tracks/293').then(function(player){
      $scope.musicplay = player
    });

    //Update the time
    var tick = function() {
      $scope.date = new Date();
      $timeout(tick, 1000 * 60);
    };

    // Reset the command text
    var restCommand = function(){
      $scope.interimResult = DEFAULT_COMMAND_TEXT;
    }

    _this.init = function() {
      $scope.map = MapService.generateMap("Seoul,Korea");
      _this.clearResults();
      tick();
      restCommand();

      //Get our location and then get the weather for our location
      GeolocationService.getLocation().then(function(geoposition){
        console.log("Geoposition", geoposition);
        WeatherService.init(geoposition).then(function(){
          $scope.currentForcast = WeatherService.currentForcast();
          $scope.weeklyForcast = WeatherService.weeklyForcast();
          console.log("Current", $scope.currentForcast);
          console.log("Weekly", $scope.weeklyForcast);
          //refresh the weather every hour
          //this doesn't acutually updat the UI yet
          //$timeout(WeatherService.refreshWeather, 3600000);
        });
      })

      // Hue communication
      //HueService.init();

      var defaultView = function() {
        console.debug("Ok, going to default view...");
        $scope.focus = "default";
      }

      // List commands
      AnnyangService.addCommand(command.whatcanisay, function() {
        console.debug("Here is a list of commands...");
        //if(responsiveVoice.voiceSupport()) {
        //  responsiveVoice.speak(command.info,command.voice);
        //}
        console.log(AnnyangService.commands);
        $scope.focus = "commands";

      });

      // Go back to default view
      AnnyangService.addCommand(command.home, defaultView);

      // Hide everything and "sleep"
      //AnnyangService.addCommand(command.sleep, function() {
      //  console.debug("Ok, going to sleep...");
      //  $scope.focus = "sleep";
      //});

      // Go back to default view
      AnnyangService.addCommand(command.wake, defaultView);

      //AnnyangService.addCommand(command.debug, function() {
      //  console.debug("Boop Boop. Showing debug info...");
      //  $scope.debug = true;
      //});

      AnnyangService.addCommand(command.map, function() {
        console.debug("Going on an adventure?");
        $scope.focus = "map";
      });

      AnnyangService.addCommand(command.locaiton, function(location) {
        console.debug("Getting map of", location);
        $scope.map = MapService.generateMap(location);
        $scope.focus = "map";
      });

      // Zoom in map
      AnnyangService.addCommand(command.zoomin, function() {
        console.debug("Zoooooooom!!!");
        $scope.map = MapService.zoomIn();
      });

      AnnyangService.addCommand(command.zoomout, function() {
        console.debug("Moooooooooz!!!");
        $scope.map = MapService.zoomOut();
      });

      AnnyangService.addCommand(command.zoomvalue, function(value) {
        console.debug("Moooop!!!", value);
        $scope.map = MapService.zoomTo(value);
      });

      AnnyangService.addCommand(command.zoomreset, function() {
        console.debug("Zoooommmmmzzz00000!!!");
        $scope.map = MapService.reset();
        $scope.focus = "map";
      });

      // Change name
      //AnnyangService.addCommand(command.name, function(name) {
      //  console.debug("Hi", name, "nice to meet you");
      //  $scope.user.name = name;
      //});

      //AnnyangService.addCommand(command.task, function(task) {
      //  console.debug("I'll remind you to", task);
      //});

      //AnnyangService.addCommand(command.reminder, function() {
      //  console.debug("Clearing reminders");
      //});

      // Clear log of commands
      AnnyangService.addCommand(command.clear, function(task) {
        console.debug("Clearing results");
        _this.clearResults()
      });

      // Check the time
      AnnyangService.addCommand(command.time, function(task) {
        console.debug("It is", moment().format('h:mm:ss a'));
        _this.clearResults();
      });

      // Turn lights off
      //AnnyangService.addCommand(command.light, function(state, action) {
      //  HueService.performUpdate(state + " " + action);
      //});


      //AnnyangService.addCommand(command.musicplay, function(state, action) {
        // // stream track id 293
      //  $scope.musicplay.play();
      //});

      //AnnyangService.addCommand(command.musicstop, function(state, action) {
      //  $scope.musicplay.pause();
      //});

      //AnnyangService.addCommand(command.playyoutube, function(term) {
      //
      //  YoutubeService.getYoutube(term,'video').then(function(){
      //    if(term){
      //      var videoId = YoutubeService.getVideoId()
      //      $scope.focus = "youtube";
      //      $scope.youtubeurl = "http://www.youtube.com/embed/" + videoId + "?autoplay=1&enablejsapi=1&version=3&playerapiid=ytplayer"
      //      $scope.currentYoutubeUrl = $sce.trustAsResourceUrl($scope.youtubeurl);
      //    }
      //  });
      //});

      AnnyangService.addCommand(command.ytbplaylist, function(term) {

        YoutubeService.getYoutube(term,'playlist').then(function(){
          if(term){
            var playlistId = YoutubeService.getPlaylistId()
            $scope.focus = "youtube";
            $scope.youtubeurl = "http://www.youtube.com/embed?autoplay=1&listType=playlist&enablejsapi=1&version=3&list="+playlistId
            $scope.currentYoutubeUrl = $sce.trustAsResourceUrl($scope.youtubeurl);
          }
        });
      });

      AnnyangService.addCommand(command.stopyoutube, function() {
        var iframe = document.getElementsByTagName("iframe")[0].contentWindow;
        iframe.postMessage('{"event":"command","func":"' + 'stopVideo' +   '","args":""}', '*');
        $scope.focus = "default";
      });

      AnnyangService.addCommand(command.subway, function(station,linenumber,updown) {
        SubwayService.init(station).then(function(){
          SubwayService.getArriveTime(linenumber,updown).then(function(data){
            if(data != null){
              $scope.subwayinfo = data[0].ARRIVETIME + "에 " + data[0].SUBWAYNAME + "행 열차가 들어오겠습니다.";
            }else{
              $scope.subwayinfo = "운행하는 열차가 존재 하지 않습니다."
            }
            $scope.focus = "subway";
          });
        });
      });

      AnnyangService.addCommand(command.term, function(term) {
        console.debug("Showing", term);
      });

      // Fallback for all commands
      AnnyangService.addCommand('*allSpeech', function(allSpeech) {
        console.debug(allSpeech);
        _this.addResult(allSpeech);
      });

      var resetCommandTimeout;
      //Track when the Annyang is listening to us
      AnnyangService.start(function(listening){
        $scope.listening = listening;
      }, function(interimResult){
        $scope.interimResult = interimResult;
        $timeout.cancel(resetCommandTimeout);
      }, function(result){
        $scope.interimResult = result[0];
        resetCommandTimeout = $timeout(restCommand, 5000);
      });
    };

    _this.addResult = function(result) {
      _this.results.push({
        content: result,
        date: new Date()
      });
    };

    _this.clearResults = function() {
      _this.results = [];
    };

    _this.init();

    io.on('msg', function(data){
      console.log(data);
      var content = angular.fromJson(angular.toJson(data));
      console.log(content.hello.content);
      if(content.hello.title == 'off'){
        $scope.focus = "clear";
        $scope.msg = 0;
        $scope.complement = command.hi;
      }else{
        $scope.complement = content.hello.content;
        $scope.msg = 1;
      }

    });

    $scope.keypress = function($event) {
      $scope.lastKey = $event.keyCode;

      //지도켜기 0
      if($event.keyCode == 96) {
        $scope.focus = "map";
      }

      //확대 +
      if($event.keyCode == 107) {
        $scope.map = MapService.zoomIn();
      }

      //축소 -
      if($event.keyCode == 109) {
        $scope.map = MapService.zoomOut();
      }

      // 유투브 재생 1
      if($event.keyCode == 97) {
        $scope.focus = "youtube";
        $scope.youtubeurl = "https://www.youtube.com/embed/WTrEFU_s5UI?autoplay=1"
        $scope.currentYoutubeUrl = $sce.trustAsResourceUrl($scope.youtubeurl);
      }

      // 유투브 정지 2
      if($event.keyCode == 98) {
        var iframe = document.getElementsByTagName("iframe")[0].contentWindow;
        iframe.postMessage('{"event":"command","func":"' + 'stopVideo' +   '","args":""}', '*');
        $scope.focus = "default";
      }

      //사용한가능한질문 엔터
      if($event.keyCode == 13) {
        //if(responsiveVoice.voiceSupport()) {
        //  responsiveVoice.speak(command.info,command.voice);
        //}
        $scope.focus = "commands";
      }

      // 클리어 .
      if($event.keyCode == 110) {
        //if(responsiveVoice.voiceSupport()) {
        //  responsiveVoice.speak("결과를 제거합니다",command.voice);
        //}
        $scope.focus = "clear";
      }

    };

  }



  angular.module('SmartMirror')
  .controller('MirrorCtrl', MirrorCtrl);



}(window.angular));
