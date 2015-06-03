/*global Computer, $, Audio, ElementProperties, ReversiGame, Player */
'extended mode';

if(window["chrome"] && window["chrome"]["global.storage"]){
	$('.tableContainer').css('margin-bottom', 0);
}

const formElements = document.querySelector('#opponent_data').elements;

var winSound = new Audio("sounds/win.wav"); // buffers automatically when created
var moveSound = new Audio("sounds/piece_on_a_board2.wav"); // buffers automatically when created

var boardElements = [];
var player1;
var player2;
var reversiGame;

window["alert"] = function (msg) {
	window.console.log(msg);
	if ("humane" in window) {
		window["humane"].log(msg, {timeout: 10000, clickToClose: true, waitForMove: true});
	} else {
		window.alert(msg);
	}
};

function removeAnimationClass() {
	this.classList.remove('flipInX');
	this.classList.remove('animated');
}

const gameObserver = function () {
    global.storage.set('reversiGame', reversiGame.serialize());
    global.storage.set('bodyClassList', document.body.className);

	reversiGame.changedPiece().forEach(function (move) {
		boardElements[move.row][move.col].className = "piece " + reversiGame.pieces()[move.row][move.col];

		// boardElements[move.row][move.col].classList.add('flipInX');
		// boardElements[move.row][move.col].classList.add('animated');
		// boardElements[move.row][move.col].addEventListener("animationend", removeAnimationClass, false);
		// boardElements[move.row][move.col].addEventListener("webkitAnimationEnd", removeAnimationClass, false);
	});

	bodyProperties.value.set("current_player", reversiGame.currentPlayer().color());

	if (reversiGame.winner()) {
		global.storage.remove("reversiGame");
        if (!document.body.classList.contains('muted')) {
            winSound.load();
            winSound.play();
        }
        bodyProperties.value.set("winner", reversiGame.winner().color());
		if (reversiGame.winner() === reversiGame.loser()) {
			window.alert('Draw! 32 pieces each');
		} else {
			window.alert(reversiGame.winner().name().toUpperCase() +
				' win with ' + reversiGame.winner().count(reversiGame) +
				' pieces vs ' + reversiGame.loser().name() +
				' with ' + reversiGame.loser().count(reversiGame) +
				' pieces');
		}
    } else {
		if (!document.body.classList.contains('muted')) {
			moveSound.load();
			moveSound.play();
		}
		reversiGame.currentPlayer().startTurn(reversiGame);
    }
	$("." + player1.color() + " > div").text(player1.count(reversiGame));
	$("." + player2.color() + " > div").text(player2.count(reversiGame));
};

const playerObserver = function (player) {
	return function (changes) {
		for (var key in changes) {
			if (changes[key].name === 'winner') {
				bodyProperties.value.set("winner", player.color());
			} else if (changes[key].name === 'stuck') {
				if (player.isStuck()) {
					bodyProperties.set.add("stuck", player.color());
				} else {
					bodyProperties.set.remove("stuck", player.color());
				}
			}
		}
	};
};

const bodyProperties = new ElementProperties(document.body);

const LocalPlayer = function (name) {
    var _this = new Player(name);

    _this.startTurn = function (game) {
		_this.setStuck(false);
		game.possibleMoves().forEach(function (move, moveNumber) {
			boardElements[move.row][move.col].classList.add("validMove");
			$(boardElements[move.row][move.col]).children().attr('tabindex', moveNumber + 1);
		});
    };

    return _this;
};


const playerMoveEvent = function (e) {
	if (e.delegateTarget.classList.contains('validMove')) {
		$(".validMove").removeClass("validMove");
		/** @type {number} */
		var row = parseInt(e.delegateTarget.dataset.row, 10);
		/** @type {number} */
		var col = parseInt(e.delegateTarget.dataset.column, 10);

		reversiGame.move({"row": row, "col": col});

		$('.piece > div').attr('tabindex', -1);
		$(this).children('div').blur();
	}
};

var opponents = {
	"Another Player": function () {return new LocalPlayer('Second Player'); },
	"Easy Computer": function () {return new Computer('Easy'); },
	"Medium Computer": function () {return new Computer('Medium'); },
	"Hard Computer": function () {return new Computer('Hard'); }
};

// var peer;
// var room;
// var _connection;
// const RemoteUser = function (name) {
//     var _reversiGame;
//     var _this = new Player(name);

//     _this.startTurn = function (game) {
// 		var lastMove = game.moveLog()[game.moveLog().length - 1];
// 		console.log("Sending... ", lastMove);
// 		_connection.send(lastMove);
// 		game = _reversiGame;
//     };
//     return _this;
// };

// opponents["Remote Player"] = function () {return new RemoteUser('Remote User'); };


const makeSelectElement = function (selectElement, dictionary) {
	selectElement.innerHTML = '';

	Object.keys(dictionary).forEach(function (dictKey) {
		var optionElement = document.createElement('option');
		optionElement.setAttribute('value', dictKey);
		optionElement.textContent = dictKey;

		selectElement.appendChild(optionElement);
	});

    Object.observe(dictionary, function () {
		makeSelectElement(selectElement, dictionary);
	});
};


const restart = function () {
	document.body.removeAttribute('data-winner');
	document.body.setAttribute('data-opponent', formElements.opponent.value);

	player1 = new LocalPlayer('You');
	$(".player1 .name").text(player1.name());

	player2 = opponents[formElements.opponent.value]();
	$(".player2 .name").text(player2.name());

	var players = [player1, player2];

	if (formElements.opponent.value.indexOf('Computer') !== -1) {
		player2.setDelay(formElements.computerDelay.value);
		if (formElements.otherColor.value === "Black") {
			players = [player2, player1];
		}
	}

	if (formElements.opponent.value.indexOf('Remote') !== -1) {
		if (formElements.otherColor.value === "Black") {
			players = [player2, player1];
		}
	}

	reversiGame = new ReversiGame(players, gameObserver);
	reversiGame.addObserver(achievementObserver);

	global.storage.get('reversiGame', function (data) {
		if (data.reversiGame) {
			reversiGame.deserialize(data.reversiGame);
		}
	});

	player1.addObserver(playerObserver(player1));
	player2.addObserver(playerObserver(player2));
	(new ElementProperties(document.querySelector(".player1"))).value.set("player_color", player1.color());
	(new ElementProperties(document.querySelector(".player2"))).value.set("player_color", player2.color());

	reversiGame.pieces().forEach(function (row, rowIndex) {
		row.forEach(function (piece, columnIndex) {
			boardElements[rowIndex][columnIndex].className = "piece " +
					reversiGame.pieces()[rowIndex][columnIndex];
		});
	});
};


const startGame = function () {
	var docfrag = document.createDocumentFragment();
	for (var rowIndex = 0; rowIndex <= 7; rowIndex += 1) {
		var rowTemplateElement = document.querySelector('#row_template');
		var rowElement = rowTemplateElement.content.cloneNode(true).querySelector('div');

		var rowElements = [];

		for (var columnIndex = 0; columnIndex <= 7; columnIndex += 1) {
			var pieceTemplateElement = document.querySelector('#piece_template');
			var pieceElement = pieceTemplateElement.content.cloneNode(true).querySelector('div');

			pieceElement.dataset.row = rowIndex;
			pieceElement.dataset.column = columnIndex;

			rowElement.appendChild(pieceElement);

			rowElements.push(pieceElement);
		}
		docfrag.appendChild(rowElement);
		boardElements.push(rowElements);
	}




	$('.restart').click(function () {
		global.storage.remove("reversiGame");
		restart();
	});
	$('.newGame').click(function () {
		if (formElements.opponent.value.indexOf('Remote') !== -1) {
			if (formElements.otherColor.value === '') {
				return false;
			}
		} else {
			var formData = {};
			for (var i = 0; i < formElements.length; i++) {
				formData[formElements[i].name] = formElements[i].value;
			}
			global.storage.set('formData', JSON.stringify(formData));
		}
		global.storage.remove("reversiGame");

		restart();

		$('.controls').hide();
	});

	$('#postmessage').submit(function (e) {
		e.preventDefault();

		var messageText = e.delegateTarget.elements.message.value;
		_connection.send({"message": messageText});
		$('.messages ol').append('<li>You: ' + messageText + '</li>')

		return false;
	});

	makeSelectElement(formElements.opponent, opponents);


	formElements.opponent.onchange = function () {
		if (formElements.opponent.value.indexOf('Computer') !== -1) {
			$('.aiSettings').show();
		} else {
			$('.aiSettings').hide();
		}
		if (formElements.opponent.value.indexOf('Remote') !== -1) {
			if (Clay.Rooms) {
				room = room || new Clay.Rooms();
			}
			formElements.otherColor.value = '';
			$('.findgame').show();
		} else {
			$('.findgame').hide();
		}
	};

	global.storage.get('formData', function (data) {
		if (data.formData) {
			const formData = JSON.parse(data.formData);
			for (var elementKey in formData) {
				formElements[elementKey].value = formData[elementKey];
			}
		} else {
			formElements.opponent.value = "Easy Computer";
		}

		formElements.opponent.onchange();
		restart();
	});

	global.storage.get('bodyClassList', function (data) {
		if (data.bodyClassList) {
			document.body.className = data.bodyClassList;
		}
	});


	document.querySelector("#board").appendChild(docfrag);

	$('.piece').click(playerMoveEvent).keypress(function (e) {
		if (e.which === 13 || e.which === 32) {
			playerMoveEvent(e);
		}
	});

	function setFullCallback() {
		_connection = peer.connect(roomObj.id);

		$('.waitingplayers').text('Game found. Loading...');
		_connection.on('open', function() {
			// Send 'Hello' on the connection.
			formElements.otherColor.value = "Black";
			$('.waitingplayers').text('Game found. Loading...Done');
			$('.newGame').click();
			_connection.send('Yo yo!! Ready to play??');
		});

		_connection.on('data', function (data) {
			// When we receive 'Hello', send ' world'.
			console.log(data);
			if (data.message) {
				$('.messages ol').append('<li>Remote Player: ' + data.message + '</li>')
			} else {
				// Append the data to body.
				reversiGame.move(data);
			}
		});
	}

	function setFullCallbackConnect() {
		peer = new Peer(roomObj.id, { key: 'lwjd5qra8257b9', debug: true });
		// Callback function for when a room is full
		// { count: # in room, id: unique int id for room, instance: instance of the room obj }
		// You can use instance like: obj.instance.leaveRoom(); to force a player out of the room
		// ex. Game.start();
		console.log( roomObj.count + " in room" );
		console.log( roomObj.id+ " is the room ID" );

		// Create a new Peer with our demo API key, with debug set to true so we can
		// see what's going on.

		// Wait for a connection from the second peer.
		peer.on('connection', function(connection) {
			$('.waitingplayers').text('Someone\'s connecting...');
			// This `connection` is a DataConnection object with which we can send
			// data.
			// The `open` event firing means that the connection is now ready to
			// transmit data.
			connection.on('open', function() {
				$('.waitingplayers').text('Someone\'s connecting...Done');
				// Send 'Hello' on the connection.
				_connection.send('Yeah!!');
				formElements.otherColor.value = "White";
				$('newGame').click();
			});
			// The `data` event is fired when data is received on the connection.
			connection.on('data', function(data) {
				if (data.message) {
					$('.messages ol').append('<li>Remote Player: ' + data.message + '</li>')
				} else {
					// Append the data to body.
					reversiGame.move(data);
				}
				console.log(data);
			});

			_connection = connection;
		});
	}


	$('.findgame').click(function () {
		var availableRooms = 4;
		$('.waitingplayers').text('Number of players waiting for a game ' + availableRooms.length + '. Waiting for game...');
		// if (availableRooms.length) {
		// 	peer = new Peer({ key: 'lwjd5qra8257b9', debug: true });
		// 	room.setFullCallback(function (roomObj) {
		// 	});

		// 	room.joinRoom(availableRooms[0].id);
		// } else {
		// 	room.setFullCallback(function (roomObj) {

		// 	});

		// 	room.createRoom("reversi game");
		// }
	});

	restart();
};

document.addEventListener("DOMContentLoaded", startGame, false);

function signinCallback(authResult) {
	var APP_ID = 'worldreversi';
	if (authResult['status']['signed_in']) {
		// Update the app to reflect a signed in user
		// Hide the sign-in button now that the user is authorized, for example:
		console.log('Sign-in state: ' + authResult['status']['signed_in']);
		document.body.classList.toggle('logged-in', authResult['status']['signed_in']);

		gapi.client.games.turnBasedMatches.create().execute(
	        function(response) {
		        console.log(response);
	     	});

		gapi.client.games.turnBasedMatches.list().execute(
	        function(response) {
		        console.log(response);
	     	});

		gapi.client.games.achievements.reveal({
			'achievementId': 'CgkI2b3OxakdEAIQAQ'
		}).execute(
	        function(response) {
		        console.log(response);
	     	});
	} else {
		// Update the app to reflect a signed out user
		// Possible error values:
		//   "user_signed_out" - User is signed-out
		//   "access_denied" - User denied access to your app
		//   "immediate_failed" - Could not automatically log in the user
		console.log('Sign-in state: ' + authResult['error']);
	}
	document.getElementById('logout').addEventListener('click', function () {gapi.auth.signOut();});
}

const achievementObserver = function () {
	if (reversiGame.loser()) {
		switch (reversiGame.loser().name()) {
			case 'Easy Computer':
				gapi.client.games.achievements.unlock({
					'achievementId': 'CgkI2b3OxakdEAIQAQ'
				})
				break;
			case 'Medium Computer':
				gapi.client.games.achievements.unlock({
					'achievementId': 'CgkI2b3OxakdEAIQAg'
				})
				break;
			case 'Hard Computer':
				gapi.client.games.achievements.unlock({
					'achievementId': 'CgkI2b3OxakdEAIQAw'
				})
				break;
		}
		console.log(reversiGame.loser().name() + ' lose');
	}
};