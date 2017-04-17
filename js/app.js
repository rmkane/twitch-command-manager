// Toastr options
toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: true,
  positionClass: 'toast-bottom-full-width',
  preventDuplicates: false,
  showDuration: 1000,
  hideDuration: 2000,
  timeOut: 10000,
  extendedTimeOut: 1000,
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut',
  onShown: function(e) {
    // Select value when shown.
    $('.toast-message input').select();
  }
};

var commandDefaults = {
	"cooldown" : 0,
  "userLevel" : "everyone"
};

var defaultCommandList = [{
  "name": "!flip",
  "description": "Flip a Coin",
  "userLevel": "everyone",
  "cooldown": 5,
  "text" : "/me $(urlfetch https://api.rtainc.co/twitch/random?format=The%20coin%20landed%20on+[0].&choices=heads,tails)"
}, {
  "name": "!uptime",
  "description": "Display current uptime",
  "text" : "/me $(twitch $(channel) \"Stream uptime: {{uptimeLength}}\")"
}, {
  "name": "!viewers",
  "description": "Display current viewer count",
  "text" : "/me $(twitch $(channel) \"{{displayName}} currently has {{viewers}} viewers.\")"
}, {
  "name": "!raid",
  "description": "Display raid message",
  "userLevel": "moderator",
  "text" : "/me Copy: <RAID MESSAGE HERE>"
}];

// app.js
(function() {
  'use strict';
  var app = angular.module('formlyApp', ['formly', 'formlyBootstrap', 'ngMessages', 'ngMaterial']);

  app.run(function(formlyConfig) {
    formlyConfig.extras.errorExistsAndShouldBeVisibleExpression = '!fc.$pending'
  });

  app.run(function(formlyValidationMessages) {
    formlyValidationMessages.messages.required = 'to.label + " is required"';
    formlyValidationMessages.messages.max = '"The max value allowed is " + to.max';
    formlyValidationMessages.messages.min = '"The min value allowed is " + to.min';

    formlyValidationMessages.addTemplateOptionValueMessage('pattern', 'patternValidationMessage', '', '', 'Invalid Input');
  });

  app.config(function(formlyConfigProvider) {
    formlyConfigProvider.setWrapper({
      name: 'hasError',
      template: '<div class="form-group" ng-class="{\'has-error\': showError}">' +
        '  <label class="control-label" for="{{id}}">{{to.label}}</label>' +
        '  <formly-transclude></formly-transclude>' +
        '  <div ng-messages="fc.$error" ng-if="showError" class="text-danger">' +
        '    <div ng-message="{{ ::name }}" ng-repeat="(name, message) in ::options.validation.messages" class="message">{{ message(fc.$viewValue)}}</div>' +
        '  </div>' +
        '</div>'
    })
  })
})();

// scripts/MainController.js
(function() {
  'use strict';
  angular
    .module('formlyApp')
    .controller('MainController', MainController);

  function MainController(userLevel, defaults) {
    var vm = this;

    vm.commandList = defaultCommandList;
    sortCommandList(vm.commandList);

    vm.applicationTitle = 'Nightbot Command Generator';
    vm.author = {
      name: 'Mr. Poliwhirl',
      url: 'https://jsfiddle.net/MrPolywhirl'
    };

    // The model object that we reference on the element in index.html
    vm.command = defaults.getCommand();

    // An array of our form fields with configuration and options set.
    // We make reference to this in the 'fields' attribute on the element
    vm.commandFields = [{
      key: 'name',
      type: 'input',
      templateOptions: {
        type: 'text',
        label: 'Command Name',
        placeholder: 'Enter a command name',
        required: true
      }
    }, {
      key: 'description',
      type: 'input',
      templateOptions: {
        type: 'text',
        label: 'Description',
        placeholder: 'Enter a command description',
        required: false
      }
    }, {
      key: 'text',
      type: 'textarea',
      templateOptions: {
        label: 'Command Text',
        placeholder: 'Enter the command text',
        required: true
      }
    }, {
      key: 'userLevel',
      type: 'select',
      defaultValue: 'everyone',
      templateOptions: {
        type: 'combo',
        label: 'User Level (minimum requirement)',
        required: false,
        options: userLevel.getUserLevels()
      },
      hideExpression: '!model.name || !model.text'
    }, {
      key: 'cooldown',
      type: 'input',
      templateOptions: {
        type: 'number',
        label: 'Cooldown (in seconds)',
        min: 0,
        max: 600,
        step: 5,
        required: true, // Not really, just for testing...
        //pattern: /^[0-9]+$/,
        //patternValidationMessage: '"Needs to match " + options.templateOptions.pattern'
      },
      defaultValue: 30,
      //validation: {
      //  messages: {
      //    required: function ($viewValue, $modelValue, scope) {
      //      return scope.to.label + ' is required';
      //    }
      //  }
      //},
      hideExpression: '!model.name || !model.text'
    }, {
      key: 'alias',
      type: 'input',
      templateOptions: {
        type: 'text',
        label: 'Alias',
        placeholder: 'Enter a command alias',
        required: false
      },
      hideExpression: '!model.name || !model.text'
    }, {
      key: 'isNew',
      type: 'checkbox',
      templateOptions: {
        label: 'New Command?',
      },
      hideExpression: '!model.name || !model.text'
        //}, {
        //  key: 'foobar',
        //  type: 'select',
        //  templateOptions: {
        //    label: 'Foobar',
        //    options: foobar.getFoobar()
        //  },
        //  hideExpression: '!model.text'
    }];

    vm.onSubmit = onSubmit;
    vm.onCommandSelect = onCommandSelect;
    vm.onImport = onImport;
    vm.onExport = onExport;
  }
  
  function onImport($scope) {
  	console.log($scope.vm);
  }
  function onExport($scope) {
  	console.log(JSON.stringify($scope.vm.commandList, null, 2));
  }
  
  function onSubmit($scope) {
    //showToast('info', 'Command', formatCommand($scope.vm.command));

    var command = $.extend(true, {}, $scope.vm.command)
    updateCommandList($scope.vm.commandList, command);
  }
  
  function onCommandSelect($scope, command) {
    $scope.vm.command = $.extend(true, {}, commandDefaults, command); // ???
  }
  
  function updateCommandList(list, command) {
    var found = list.map((c, i) => c.name === command.name ? i : -1).filter(x => x > -1);
    if (found.length === 1) {
      list[found[0]] = command;
    } else {
      list.push(command);
    }
    sortCommandList(list);
  }

  function sortCommandList(list) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  function validateInteger(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
  }

  function showToast(level, title, description) {
    toastr[level]($('#toast').val(description).clone().prop('type', 'input').outerHTML(), title);
  }

  function formatCommand(command) {
    return [
      command.name,
      command.isNew ? 'add' : 'edit',
      command.userLevel !== 'everyone' ? '-ul=' + command.userLevel : null,
      '-cl=' + command.cooldown,
      command.alias != null ? '-a=' + command.alias : null,
      command.text,
    ].filter(x => x != null).join(' ');
  }
})();

// scripts/userLevel.js
(function() {
  'use strict';

  angular
    .module('formlyApp')
    .factory('userLevel', userLevel);

  function userLevel() {
    function getUserLevels() {
      return [{
        "name": "Channel Owner",
        "value": "owner"
      }, {
        "name": "Channel Moderator",
        "value": "moderator"
      }, {
        "name": "Nightbot Regular",
        "value": "regular"
      }, {
        "name": "Paid Channel Subscriber",
        "value": "subscriber"
      }, {
        "name": "Normal User",
        "value": "everyone"
      }];
    }
    return {
      getUserLevels: getUserLevels
    }
  }
})();

// scripts/defaults.js
(function() {
  'use strict';

  angular
    .module('formlyApp')
    .factory('defaults', defaults);

  function defaults() {
    function getCommand() {
      return {
        name: '!roll',
        description: 'Roll a D6 die',
        text: '/me $(urlfetch https://api.rtainc.co/twitch/random?format=The%20die%20landed%20on+[0].&choices=1,2,3,4,5,6)',
        cooldown : 5
      };
    }
    return {
      getCommand: getCommand
    }
  }
})();

$(function() {
  autosize($('textarea'));
});
