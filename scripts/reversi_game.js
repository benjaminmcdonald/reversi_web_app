// ==ClosureCompiler==
// @output_file_name board.min.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/underscore-1.3.1.js
// @code_url https://github.com/lukeasrodgers/underscore-js-externs/raw/master/underscore-1.4.4.js
// @code_url https://github.com/lukeasrodgers/backbone-js-externs/raw/master/backbone-0.9.2-externs.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/google_analytics_api.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/chrome_extensions.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/webkit_console.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/mediasource.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/json.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/fileapi_synchronous.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/fullscreen.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/w3c_audio.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/w3c_eventsource.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/w3c_speech.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/w3c_web_intents.js
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/jquery-1.8.js
// @js_externs Board PLAYERS
// ==/ClosureCompiler==
'strict mode';

const EMPTY = 'empty';
const DRAW = 'Draw';
const POSITION_WEIGHTS = [
    [500, -10, 2, 1],
    [-10, -10, 0, 0],
    [2, 0, 0, 0],
    [1, 0, 0, 0]
];
const PLAYERS = ['Black', 'White'];

/**
 * @param {number} row
 * @param {number} col
 * @return {number}
 */
const getStrategicValueOfPosition = function (row, col) {
    return POSITION_WEIGHTS[row <= 3 ? row : -row + 7][col <= 3 ? col : -col + 7];
};

/**
 * @param {Array.<Array.<string>>} board
 * @param {number} rowIndex
 * @param {number} colIndex
 * @return {boolean}
 */
const isTakable = function (board, rowIndex, colIndex) {
    if (board[rowIndex][colIndex] === EMPTY) {
        return false;
    }
    if (!(rowIndex === 0 || rowIndex === board.length - 1 ||
        colIndex === 0 || colIndex === board.length - 1)) {
        return true;
    }

    /** @type {boolean} */
    var hasEmptyBelow = false;
    /** @type {boolean} */
    var hasEmptyAbove = false;
    for (var i = 0; i < 8; i++) {
        if (rowIndex === 0 || rowIndex === board.length - 1) {
            if (board[rowIndex][i] !== board[rowIndex][colIndex]) {
                if (i < colIndex) {
                    hasEmptyBelow = true;
                } else {
                    hasEmptyAbove = true;
                }
            }
        } else if (colIndex === 0 || colIndex === board.length - 1) {
            if (board[i][colIndex] !== board[rowIndex][colIndex]) {
                if (i < rowIndex) {
                    hasEmptyBelow = true;
                } else {
                    hasEmptyAbove = true;
                }
            }
        }
    }

    return hasEmptyBelow && hasEmptyAbove;
};

/**
 * @param {Array.<Array.<string>>} board
 * @param {number} row
 * @param {number} col
 * @return {?number}
 */
const getStrategicValueOfMove = function (board, row, col, player,
        otherPlayer) {
    /** @type {number} */
    var strategicValue = getStrategicValueOfPosition(row, col);
    /** @type {number} */
    var takablePieces = 0;
    getLinearlyEncodedPieces(board, row, col, player, otherPlayer,
                function (i, direction) {
        takablePieces += i;
        for (var step = 1; step <= i; step++) {
            strategicValue += getStrategicValueOfPosition(row + (direction[0] * step), col + (direction[1] * step));
        }
    });

    if (takablePieces === 0) {
        return null;
    }

    return strategicValue;
};

/**
 * @param {Array.<Array.<string>>} board
 * @param {number} row
 * @param {number} col
 * @param {string} player
 * @param {string} otherPlayer
 * @param {function(number, Array.<number>)} callback
 */
const getLinearlyEncodedPieces = function (board, row, col, player, otherPlayer, callback) {
    if (board[row][col] === EMPTY) {
        const directions = [[-1, 0], [-1, 1], [0, 1],
                                            [1, 1], [1, 0], [1, -1],
                                            [0, -1], [-1, -1]];
        directions.forEach(function (direction) {
            /** @type {number} */
            var i = 1;
            while (col + (direction[1] * i) < board[0].length && row + (direction[0] * i) < board.length && col + (direction[1] * i) >= 0 && row + (direction[0] * i) >= 0) {
                if (board[row + (direction[0] * i)][col + (direction[1] * i)] === otherPlayer) {
                    i += 1;
                } else if (board[row + (direction[0] * i)][col + (direction[1] * i)] === player) {
                    if (i > 1) {
                        callback(i, direction);
                    }
                    break;
                } else {
                    break;
                }
            }
        });
    }
};


/**
 * @param {Array.<Array.<string>>} board
 * @param {string} currentPlayer
 * @return {number}
 */
const boardSettupValue = function (board, currentPlayer) {
    /** @type {number} */
    var playerPieceCount = 0;
    /** @type {number} */
    var pieceCount = 0;
    /** @type {number} */
    var stratSum = board.reduce(function (a, row, rowi) {
        return a + row.reduce(function (a2, col, coli) {
                /** @type {number} */
                var pieceValue = 0;

                if (col === EMPTY) {
                    pieceValue = 0;
                } else {
                    pieceCount += 1;
                    if (isTakable(board, rowi, coli)) {
                        pieceValue = getStrategicValueOfPosition(rowi, coli);
                    } else {
                        pieceValue = 150;
                    }
                }

                if (col !== currentPlayer) {
                    pieceValue = -pieceValue;
                } else {
                    playerPieceCount += 1;
                }

                return a2 + pieceValue;

            }, 0);
    }, 0);

    if (pieceCount < 40) {
        stratSum  -= playerPieceCount;
    }

    return stratSum;
};

/**
 * @param {number} board_size
 */
const make_board = function (board_size) {
    var board = [];
    for (var i = 0; i < board_size; i++) {
        board.push([]);
        for (var j = 0; j < board_size; j++) {
            var symbol = EMPTY;

            if (i === board_size / 2) {
                if (j === board_size / 2) {
                    symbol = PLAYERS[1];
                } else if (j + 1 === board_size / 2) {
                    symbol = PLAYERS[0];
                }
            } else if (i + 1 === board_size / 2) {
                if (j === board_size / 2) {
                    symbol = PLAYERS[0];
                } else if (j + 1 === board_size / 2) {
                    symbol = PLAYERS[1];
                }
            }
            board[i].push(symbol);
        }
    }

    return board;
};

const ReversiGame = function (players, observer) {
    // Black goes first
    players[0].setColor(PLAYERS[0]);
    players[1].setColor(PLAYERS[1]);


    /** @type {Object} */
    const _private = {
        "turn": 0,
        "winner": null,
        "loser": null,
        "possibleMoves": [],
        "changedSquares": [],
        "moveLog": [],
        "pieces": make_board(8)
    };

    Object.observe(_private, observer);

    const updateMoves = function () {
        const getGameResult = function () {
            const currentPlayerCount = _this.currentPlayer().count(_this);
            const otherPlayerCount = _this.otherPlayer().count(_this);

            if (currentPlayerCount > otherPlayerCount) {
                _this.currentPlayer().winGame();
                _private.winner = _this.currentPlayer();
                _private.loser = _this.otherPlayer();
            } else if (currentPlayerCount < otherPlayerCount) {
                _this.otherPlayer().winGame();
                _private.winner = _this.otherPlayer();
                _private.loser = _this.currentPlayer();
            } else {
                _this.otherPlayer().winGame();
                _this.currentPlayer().winGame();
                _private.winner = _this.currentPlayer();
                _private.loser = _this.currentPlayer();
            }
        };

        const getMoves = function () {
            /** @type {Array.<!Object>} */
            var validMoves = [];
            _private.pieces.forEach(function (ei, row) {
                ei.forEach(function (ej, col) {
                    const stratValue = getStrategicValueOfMove(_private.pieces, row, col, _this.currentPlayer().color(), _this.otherPlayer().color());
                    if (stratValue !== null) {
                        const piece = {
                            "row": row,
                            "col": col,
                            "stratValue": stratValue
                        };

                        validMoves.push(piece);
                    }
                });
            });

            return validMoves;
        };

        _private.possibleMoves = getMoves();

        if (_private.possibleMoves.length === 0) {
            if (_this.otherPlayer().isStuck()) {
                _this.currentPlayer().setStuck(false);
                _this.otherPlayer().setStuck(false);
                getGameResult();
            } else {
                _this.currentPlayer().setStuck(true);
                _this.move();
            }
        }
    };

    const _this = {
        "move": function (piece) {
            if (!_this.currentPlayer().isStuck()) {
                /** @type {boolean} */
                var isPossibleMove = false;
                _private.possibleMoves.forEach(function (possibleMove) {
                    if (possibleMove.row === piece.row && possibleMove.col === piece.col) {
                        isPossibleMove = true;
                    }
                });
                if (!isPossibleMove) {
                    window.console.error(isPossibleMove, piece, _private.possibleMoves);
                    return;
                }

                _private.moveLog.push(piece);
                _private.changedSquares = [];

                getLinearlyEncodedPieces(_private.pieces, piece.row, piece.col, _this.currentPlayer().color(),
                            _this.otherPlayer().color(), function (i, direction) {
                    for (var step = 1; step <= i; step++) {
                        _private.changedSquares.push({
                            "row": piece.row + (direction[0] * step),
                            "col": piece.col + (direction[1] * step)
                        });
                    }
                });

                _private.changedSquares.push({
                    "row": piece.row,
                    "col": piece.col
                });

                _private.changedSquares.forEach(function (square) {
                    _private.pieces[square.row][square.col] = _this.currentPlayer().color();
                });
            }
            _private.turn += 1;

            updateMoves();
        },
        "currentPlayer": function () {
            return players[(_private.turn) % players.length];
        },
        "otherPlayer": function () {
            return players[(_private.turn + 1) % players.length];
        },
        "pieces": function () {
            return _private.pieces;
        },
        "winner": function () {
            return _private.winner;
        },
        "loser": function () {
            return _private.loser;
        },
        "possibleMoves": function () {
            return _private.possibleMoves;
        },
        "moveLog": function () {
            return _private.moveLog;
        },
        "changedPiece": function () {
            return _private.changedSquares;
        },
        "serialize": function () {
            return JSON.stringify(_private);
        },
        "deserialize": function (jsonData) {
            const data = JSON.parse(jsonData);
            for (var key in data) {
                _private[key] = data[key];
            }
        }
    };

    _this.addObserver = function (observer) {
        Object.observe(_private, observer);
    };

    updateMoves();

    return _this;
};

const PlayerInterface = function () {
    return {
        "name": function () {throw "method not overridden"; },
        "addObserver": function () {throw "method not overridden"; },
        "color": function () {throw "method not overridden"; },
        "setStuck": function () {throw "method not overridden"; },
        "isStuck": function () {throw "method not overridden"; },
        "setColor": function () {throw "method not overridden"; },
        "startTurn": function () {throw "method not overridden"; },
        "isWinner": function () {throw "method not overridden"; },
        "winGame": function () {throw "method not overridden"; },
        "count": function () {throw "method not overridden"; },
        "setCount": function () {throw "method not overridden"; },
        "serialize": function () {throw "method not overridden"; },
        "deserialize": function () {throw "method not overridden"; }
    };
};

const Player = function (name) {
    const _private = {
        "winner": false,
        "color": undefined,
        "count": 0,
        "stuck": false
    };

    var _this = new PlayerInterface();

    /**
    @param Object.<string> r
    */
    _this.name = function () {
        return name;
    };
   /**
    @param Object.<string> r
    */
    _this.addObserver = function (observer) {
        Object.observe(_private, observer);
    };
   /**
    @param Object.<string> r
    */
    _this.color = function () {
        window.console.assert(_private.color);
        return _private.color;
    };
   /**
    @param Object.<string> r
    */
    _this.setStuck = function (stuck) {
        _private.stuck = stuck;
    };
   /**
    @param Object.<string> r
    */
    _this.isStuck = function () {
        return _private.stuck;
    };
   /**
    @param Object.<string> r
    */
    _this.setColor = function (newColor) {
        _private.color = newColor;
    };
   /**
    @param Object.<string> r
    */
    _this.isWinner = function () {
        return _private.winner;
    };
   /**
    @param Object.<string> r
    */
    _this.winGame = function () {
        _private.winner = true;
    };
   /**
    @param Object.<string> r
    */
    _this.count = function (game) {
        return game.pieces().reduce(function (a, b) {
            return a + b.filter(function (e) {
                return e === _private.color;
            }).length;
        }, 0);
    };
    _this.setCount = function (count) {
        _private.count = count;
    };
    _this.serialize = function () {
        return JSON.stringify(_private);
    };
    _this.deserialize = function (jsonData) {
        const data = JSON.parse(jsonData);
        for (var key in data) {
            _private[key] = data[key];
        }
    };

    return _this;
};
