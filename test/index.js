'use strict';

const path = require('path');
const _ = require('lodash');
const slice = require('sliced');

var verticalTokens = 'top bottom outer-top outer-bottom'.split(' ');
var horizontalTokens = 'left right outer-left outer-right'.split(' ');
var centerTokens = 'center'.split(' ');

/**
 * @param {string} value
 * @returns {Position}
 * @constructor
 */
class Position {
  constructor (value) {
    if (!(this instanceof Position)) {
      return new Position(value);
    }

    this.value = value;
    this._isVertical = void 0;
    this._isHorizontal = void 0;
    this._isCenter = void 0;
    this._isNothing = void 0;

    this.isVertical();
    this.isHorizontal();
    this.isCenter();
    this.isNothing();
  }

  isVertical () {
    if (_.isUndefined(this._isVertical)) {
      this._isVertical = !!~verticalTokens.indexOf(this.value)
    }

    return this._isVertical;
  }

  isHorizontal () {
    if (_.isUndefined(this._isHorizontal)) {
      this._isHorizontal = !!~horizontalTokens.indexOf(this.value)
    }

    return this._isHorizontal;
  }

  isCenter () {
    if (_.isUndefined(this._isCenter)) {
      this._isCenter = !!~centerTokens.indexOf(this.value);
    }

    return this._isCenter;
  }

  isNothing () {
    if (_.isUndefined(this._isNothing)) {
      this._isNothing = !this.isCenter() && !this.isHorizontal() && !this.isVertical();
    }

    return this._isNothing;
  }
}


//Position.prototype.isVertical = function Position$isVertical () {
//  if (_.isUndefined(this._isVertical)) {
//    this._isVertical = !!~verticalTokens.indexOf(this.value)
//  }
//
//  return this._isVertical;
//};
//
//Position.prototype.isHorizontal = function Position$isHorizontal () {
//  if (_.isUndefined(this._isHorizontal)) {
//    this._isHorizontal = !!~horizontalTokens.indexOf(this.value)
//  }
//
//  return this._isHorizontal;
//};
//
//Position.prototype.isCenter = function Position$isCenter () {
//  if (_.isUndefined(this._isCenter)) {
//    this._isCenter = !!~centerTokens.indexOf(this.value);
//  }
//
//  return this._isCenter;
//};
//
//Position.prototype.isNothing = function Position$isNothing () {
//  if (_.isUndefined(this._isNothing)) {
//    this._isNothing = !this.isCenter() && !this.isHorizontal() && !this.isVertical();
//  }
//
//  return this._isNothing;
//};


var getPositions = function getPositions () {
  var args = slice(arguments);

  args = _(args)
    .flattenDeep()
    .map(position => position.split(' '))
    .flatten()
    .map(position => _.trim(position))
    .compact()
    .map(position => new Position(position))
    .value();

  var positions = {
    vertical: null,
    horizontal: null
  };

  console.log(args);

  switch (args.length) {
    case 0:

      break;
    case 1:

      break;
    case 2:

      break;
    case 3:

      break;
    default:
      args = slice(args, 0, 4);


      break;
  }

};

getPositions('top  right ', ['center'], [['outer-right '], 'outer-left']);
