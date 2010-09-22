//Stolen from:
//http://www.lshift.net/blog/2006/08/03/subclassing-in-javascript-part-2
function extend(superclass, constructor, prototype) {
    var withoutcon = function () {};
    withoutcon.prototype = superclass.prototype;
    constructor.prototype = new withoutcon();
    for (var k in prototype) {
        constructor.prototype[k] = prototype[k];
    }
    return constructor;
}
