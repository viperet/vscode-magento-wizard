module.exports = function (value) {
    return require('case').snake(value.replace(/[^a-zA-Z0-9]+/g, '')); //
};