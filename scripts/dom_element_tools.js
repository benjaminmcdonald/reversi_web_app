/*global $ */
'extended mode';

const ElementProperties = function (element) {
    const _this = {
        bool : {},
        set : {},
        value : {}
    };

    _this.bool.set = function (key, bool) {
        if (bool) {
            element.classList.add(key);
        } else {
            element.classList.remove(key);
        }
    };

    _this.bool.get = function (key) {
        return element.classList.contains(key);
    };

    _this.set.add = function (setName, value) {
        var elementSet = _this.set.get(setName);
        elementSet.push(value);
        element.dataset['set_' + setName] = elementSet.join(" ");
    };

    _this.set.remove = function (setName, value) {
        var elementSet = _this.set.get(setName);
        delete elementSet[elementSet.indexOf(value)];

        element.dataset['set_' + setName] = elementSet.join(" ");
    };

    _this.set.get = function (setName) {
        if (!(setName in element.dataset)) {
            element.dataset['set_' + setName] = "";
        }
        var set = element.dataset['set_' + setName].split();
        return set;
    };

    _this.value.set = function (key, value) {
        element.dataset[key] = value;
    };

    _this.value.get = function (key) {
        return element.dataset[key];
    };

    return Object.freeze(_this);
};

$('[data-togglebody]').click(function (event) {
    var classString = event.delegateTarget.getAttribute('data-togglebody');
    document.body.classList.toggle(classString);
    if (document.body.classList.contains(classString)) {
        event.delegateTarget.checked = true;
        event.delegateTarget.classList.add('push_button_pressed');
    } else {
        event.delegateTarget.classList.remove('push_button_pressed');
        event.delegateTarget.checked = false;
    }
});

$('[data-toggle]').click(function (event) {
    if ($('.' + event.delegateTarget.getAttribute('data-toggle')).css('display') === 'block') {
        event.delegateTarget.classList.remove('push_button_pressed');
        $('.' + event.delegateTarget.getAttribute('data-toggle')).css('display', 'none');

        event.delegateTarget.checked = false;
    } else {
        event.delegateTarget.classList.add('push_button_pressed');
        $('.' + event.delegateTarget.getAttribute('data-toggle')).css('display', 'block');

        event.delegateTarget.checked = true;
    }
});

Object.values = function (obj) {
    var vals = [];
    for( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) {
            vals.push(obj[key]);
        }
    }
    return vals;
};

$('[data-hover-class]').mouseout(function (event) {
    var classString = event.delegateTarget.getAttribute('data-hover-class');
    document.body.classList.remove(classString);
});

$('[data-hover-class]').mouseover(function (event) {
    var classString = event.delegateTarget.getAttribute('data-hover-class');
    document.body.classList.add(classString);
});

const queryObj = function () {
    var result = {};
    const keyValuePairs = location.search.slice(1).split('&');

    keyValuePairs.forEach(function (keyValuePair) {
        keyValuePair = keyValuePair.split('=');
        if (keyValuePair[0]) {
            result[keyValuePair[0]] = keyValuePair[1] || '';
        }
    });

    return result;
};


const queryURL = queryObj();
for (var key in queryURL) {
    queryURL[key] = queryURL[key].replace("/", "");
    if (queryURL[key] === "true" || key === "") {
        document.body.classList.add(key);
    } else {
        document.body.dataset[key] = queryURL[key];
    }
}

var url = document.URL;
$('a[href="'+url+'"]').addClass('active');