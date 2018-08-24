var dust = require('dust')();

var serand = require('serand');
var utils = require('utils');
var uready = require('uready');
var page = serand.page;
var redirect = serand.redirect;

var app = serand.boot('advertising');
var layout = serand.layout(app);

var loginUri = utils.resolve('advertising:///auth');

var user;

var can = function (permission) {
    return function (ctx, next) {
        if (user) {
            return next();
        }
        serand.emit('user', 'login', ctx.path);
    };
};

page(uready);

page('/signin', function (ctx) {
    var query = ctx.query | {};
    serand.emit('user', 'login', query.dest || '/');
});

page('/auth', function (ctx) {
    var el = $('#content');
    serand.emit('user', 'logged in', {
        username: el.data('username'),
        access: el.data('access'),
        expires: el.data('expires'),
        refresh: el.data('refresh')
    });
});

page('/', function (ctx) {
    layout('one-column')
        .area('#header')
        .add('advertising-navigation')
        //.add('breadcrumb')
        .area('#middle')
        .add('advertising-home')
        .render();
});

page('/add', function (ctx) {
    layout('one-column')
        .area('#header')
        .add('advertising-navigation')
        //.add('breadcrumb')
        .area('#middle')
        .add('advertisements-create', ctx.query)
        .render();
});

page('/advertisements/:id', can('advertisements:read'), function (ctx) {
    layout('one-column')
        .area('#header')
        .add('advertising-navigation')
        //.add('breadcrumb')
        .area('#middle')
        .add('advertisements-findone', {
            id: ctx.params.id
        })
        .render();
});

page('/vehicles/:id/edit', can('vehicle:update'), function (ctx) {
    layout('one-column')
        .area('#header')
        .add('advertising-navigation')
        //.add('breadcrumb')
        .area('#middle')
        .add('advertisements-create', {
            id: ctx.params.id
        })
        .render();
});

page('/add', can('vehicle:create'), function (ctx) {
    layout('one-column')
        .area('#header')
        .add('advertising-navigation')
        .area('#middle')
        .add('advertisements-create')
        .render();
});

//TODO: redirect user to login page when authentication is needed
//TODO: basically a front controller pattern
serand.on('user', 'login', function (path) {
    var ctx;
    if (!path) {
        ctx = serand.current();
        path = ctx.path;
    }
    serand.store('state', {
        path: path
    });
    serand.emit('user', 'authenticator', {
        type: 'serandives',
        location: loginUri
    }, function (err, uri) {
        redirect(uri);
    });
});

serand.on('user', 'ready', function (usr) {
    user = usr;
});

serand.on('user', 'logged in', function (usr) {
    user = usr;
    var state = serand.store('state', null);
    redirect(state ? state.path : '/');
});

serand.on('user', 'logged out', function (usr) {
    user = null;
    redirect('/');
});

serand.emit('serand', 'ready');
