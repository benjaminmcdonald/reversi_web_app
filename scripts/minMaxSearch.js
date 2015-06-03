// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// @code_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/underscore-1.3.1.js
// ==/ClosureCompiler==
'extended mode';

importScripts('../bower_components/lodash/dist/lodash.compat.min.js');
importScripts('reversi_game.js');


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
 * @param {Array.<Array.<string>>} board
 * @param {string} currentPlayer
 * @param {string} otherPlayer
 * @return {?string}
 */
const getGameResult = function (board, currentPlayer, otherPlayer) {
    /** @type {?string} */
    var result = null;

    if (getMoves(board, currentPlayer, otherPlayer).length === 0 &&
                getMoves(board, otherPlayer, currentPlayer).length === 0) { //Game is over

        /** @type {number} */
        var p1Sum = board.reduce(function (a, b) {
            return a + b.filter(function (e) {
                return e === currentPlayer;
            }).length;
        }, 0);
        /** @type {number} */
        var p2Sum = board.reduce(function (a, b) {
            return a + b.filter(function (e) {
                return e === otherPlayer;
            }).length;
        }, 0);

        if (p1Sum > p2Sum) {
            return currentPlayer;
        } else if (p1Sum < p2Sum) {
            return otherPlayer;
        } else {
            return DRAW;
        }
    }

    return result;
};

/**
 * @param {Array.<Array.<string>>} board
 * @param {number} row
 * @param {number} col
 * @param {string} piece
 * @param {string} otherPlayer
 * @return {Array.<Array.<string>>}
 */
const makeMoveOnBoard = function (board, row, col, piece, otherPlayer) {
    getLinearlyEncodedPieces(board, row, col, piece, otherPlayer,
                function (i, direction) {
        _.range(1, i).forEach(function (j) {
            board[row + (direction[0] * j)][col + (direction[1] * j)] = piece;
        });
    });

    board[row][col] = piece;

    return board;
};

/**
 * @param {Array.<Array.<string>>} board
 * @param {string} player
 * @param {string} otherPlayer
 * @return {Array.<!Object>}
 */
const getMoves = function (board, player, otherPlayer) {
    /** @type {Array.<!Object>} */
    var validMoves = [];
    board.forEach(function (ei, row) {
        ei.forEach(function (ej, col) {
            /** @type {?number} */
            var stratValue = getStrategicValueOfMove(board, row, col, player, otherPlayer, 0);
            if (stratValue !== null) {
                var piece = {};
                piece.row = row;
                piece.col = col;
                piece.stratValue = stratValue;

                validMoves.push(piece);
            }
        });
    });

    return validMoves;
};

/**
 * @param {Array.<Array.<string>>} board
 * @param {string} currentPlayer
 * @param {string} otherPlayer
 * @param {Object} lastMove
 * @return {!Object}
 */
const TreeNode = function (board, currentPlayer, otherPlayer, lastMove) {
    /** @type {Array.<!Object>} */
    const moveList = getMoves(board, currentPlayer, otherPlayer);

    /** @type {number} */
    var nodeValue = 0;
    if (moveList.length === 0) {
        /** @type {number} */
        const winner = getGameResult(board, currentPlayer, otherPlayer);
        if (winner === currentPlayer) {
            nodeValue = Number.MAX_VALUE;            // current player wins!
        } else if (winner === DRAW) {
            nodeValue = -2000;                   // tie game!
        } else if (winner !== null) {
            nodeValue = -Number.MAX_VALUE;           // current player loses
        } else {
            nodeValue = 2000;           // current player loses
        }
    } else {
        /** @type {object} */
        // var bestOverallMove = _.max(moveList, function (move) {
        //     return move.stratValue;
        // });

        // var moveValues = moveList.reduce(function (previousValue, currentValue, index, array) {
        //     return previousValue + currentValue;
        // });

        //~ parseInt(/50, 10);-(moveList.length*5)
        nodeValue = boardSettupValue(board, currentPlayer);
    }

    var _this = {};

    _this.numChildNodes = moveList.length;
    _this.childNodes = function () {
        var childNodes = [];
        moveList.forEach(function (move) {
            var tempBoard = board.map(function (e) {
                return e.slice(0);
            });
            tempBoard = makeMoveOnBoard(tempBoard, move.row, move.col, currentPlayer, otherPlayer);
            childNodes.push(new TreeNode(tempBoard, otherPlayer, currentPlayer, move));
        });
        return childNodes;
    };
    _this.value = function () {
        return nodeValue;
    };
    _this.lastMove = function () {
        return lastMove;
    };

    return _this;
};

/**
 * @type {number}
 */
var maxDepth = 1;

/**
 * @param {!Object} node
 * @param {number} depth
 * @param {number} alpha
 * @param {number} beta
 * @return {number|!Object}
 */
const playMax = function (node, depth, alpha, beta) {
    if (node.numChildNodes === 0 || depth >= maxDepth) {
        return node.value();
    }

    var value = -Infinity;
    var children = node.childNodes();
    children = _.shuffle(children);
    children = children.sort(function (e, e2) {
        return e2.value() - e.value();
    });
    var bestNode = children[0];
    for (var i = 0; i < children.length; i++) {
        value = Math.max(value, playMin(children[i], depth + 1, alpha, beta));
        if (value > beta) {
            return value;
        }
        if (value > alpha) {
            alpha = value;
            bestNode = children[i];
        }
    }
    if (depth === 0) {
        return bestNode;
    }
    return value;
};

/**
 * @param {!Object} node
 * @param {number} depth
 * @param {number} alpha
 * @param {number} beta
 * @return {number|!Object}
 */
const playMin = function (node, depth, alpha, beta) {
    if (node.numChildNodes === 0 || depth >= maxDepth) {
        return -node.value();
    }

    var value = Infinity;
    const children = node.childNodes().sort(function (e, e2) {
        return e2.value() - e.value();
    });
    for (var i = 0; i < children.length; i++) {
        value = Math.min(value, playMax(children[i], depth + 1, alpha, beta));
        if (value < alpha) {
            return value;
        }
        if (value < beta) {
            beta = value;
        }
    }
    return value;
};


/**
 * @param {!Object} msg
 */
self.onmessage = function (msg) {
    maxDepth = {
        "Easy": 1,
        "Medium": 1,
        "Hard": 4
    }[msg.data[3]];

    const rootNode = new TreeNode(msg.data[0], msg.data[1], msg.data[2], {});

    var bestNode;
    if (msg.data[3] === "Easy") {
        var children = rootNode.childNodes();
        children = _.shuffle(children);

        bestNode = children[0];
    } else {
        bestNode = playMax(rootNode, 0, -Infinity, Infinity);
    }
    postMessage([bestNode.lastMove().row, bestNode.lastMove().col]);
};

