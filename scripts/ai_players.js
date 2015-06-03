/*global Player */

const Computer = function (difficulty) {
	var _reversiGame;
    var _this = new Player(difficulty + ' Computer');
	var worker = new Worker('scripts/minMaxSearch.js');
	var _delay = 0;
	worker.addEventListener('message', function (e) {
        window.console.timeEnd('AIMove');
		if (_reversiGame.currentPlayer() === _this) {
			_reversiGame.move({"row": e.data[0], "col": e.data[1]});
		} else {
			window.console.error('Computer failed to move');
		}
	}, false);

    _this.startTurn = function (game) {
		_reversiGame = game;
		setTimeout(function () {
			_this.setStuck(false);
			window.console.time('AIMove');
			worker.postMessage([game.pieces(), game.currentPlayer().color(), game.otherPlayer().color(), difficulty]);
			// worker.postMessage([reversiGame.deserialize(), difficulty]);
		}, _delay);
    };

    _this.setDelay = function (delay) {
		_delay = delay;
    };

    return _this;
};