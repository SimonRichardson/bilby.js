function findRegistered(registrations, args) {
    var i;

    for(i = 0; i < registrations.length; i++) {
        if(registrations[i].predicate.apply(this, args))
            return registrations[i].f;
    }

    throw new Error("Method not implemented for this input");
}

function makeMethod(registrations) {
    return function() {
        var args = [].slice.call(arguments);
        return findRegistered(registrations, args).apply(this, args);
    };
}

function environment(methods, properties) {
    var i;

    if(!(this instanceof environment) || (typeof this.method != 'undefined' && typeof this.property != 'undefined'))
        return new environment(methods, properties);

    methods = methods || {};
    properties = properties || {};

    for(i in methods) {
        this[i] = makeMethod(methods[i]);
    }

    for(i in properties) {
        this[i] = properties[i];
    }

    this.method = curry(function(name, predicate, f) {
        var newMethods = extend(methods, singleton(name, (methods[name] || []).concat({
            predicate: predicate,
            f: f
        })));
        return environment(newMethods, properties);
    });

    this.property = curry(function(name, value) {
        var newProperties = extend(properties, singleton(name, value));
        return environment(methods, newProperties);
    });

    this.extend = function(extraMethods, extraProperties) {
        var newMethods = {},
            newProperties = {},
            i;

        for(i in methods) {
            newMethods[i] = methods[i].concat(extraMethods[i]);
        }
        for(i in extraMethods) {
            if(i in newMethods) continue;
            newMethods[i] = extraMethods[i];
        }

        return environment(
            newMethods,
            extend(properties, extraProperties)
        );
    };

    this.append = function(e) {
        return e.extend(methods, properties);
    };
}

environment.concat = function(es) {
    // Before environment is setup; can't use a generic monoid concat.
    var accum = environment(),
        i;

    for(i = 0; i < es.length; i++) {
        accum = accum.append(es[i]);
    }

    return accum;
};
